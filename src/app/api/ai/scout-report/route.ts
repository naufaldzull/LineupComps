import { NextResponse } from "next/server";

import { buildBasketballReportContext } from "@/lib/basketball-report-context";
import { TTLCache } from "@/lib/cache";
import { generateScoutReport } from "@/lib/gemini";
import { isFinishedGame } from "@/lib/api-sports";
import { RateLimiter } from "@/lib/rate-limit";
import type {
  BasketballReportContext,
  Matchup,
  StructuredScoutReport,
} from "@/lib/types";

const TEN_MINUTES = 10 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const reportCache = new TTLCache<StructuredScoutReport>();
const rateLimiter = new RateLimiter(10, 60_000);

type ScoutReportRequest = {
  matchup?: Matchup;
  model?: string;
};

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function hasTeamSummary(value: unknown): value is Matchup["home"] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const team = value as Partial<Matchup["home"]>;

  return isString(team.id) && isString(team.name);
}

function hasMetrics(value: unknown): value is Matchup["home"]["metrics"] {
  return (
    Array.isArray(value) &&
    value.every((metric) => {
      if (!metric || typeof metric !== "object") {
        return false;
      }

      const teamMetric = metric as Record<string, unknown>;

      return (
        isString(teamMetric.label) &&
        typeof teamMetric.value === "number" &&
        (teamMetric.displayValue === undefined ||
          typeof teamMetric.displayValue === "string")
      );
    })
  );
}

function hasRecentForm(value: unknown): value is string[] | undefined {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

function isMatchup(value: unknown): value is Matchup {
  if (!value || typeof value !== "object") {
    return false;
  }

  const matchup = value as Partial<Matchup>;

  return Boolean(
    matchup.game &&
      isString(matchup.game.id) &&
      (matchup.game.sport === "basketball" ||
        matchup.game.sport === "football") &&
      isString(matchup.game.league) &&
      isString(matchup.game.startsAt) &&
      (matchup.game.status === undefined ||
        typeof matchup.game.status === "string") &&
      hasTeamSummary(matchup.game.homeTeam) &&
      hasTeamSummary(matchup.game.awayTeam) &&
      hasTeamSummary(matchup.home) &&
      hasRecentForm(matchup.home.recentForm) &&
      hasMetrics(matchup.home.metrics) &&
      hasTeamSummary(matchup.away) &&
      hasRecentForm(matchup.away.recentForm) &&
      hasMetrics(matchup.away.metrics),
  );
}

export async function POST(request: Request) {
  let body: ScoutReportRequest;

  try {
    body = (await request.json()) as ScoutReportRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !isMatchup(body.matchup)) {
    return NextResponse.json({ error: "matchup is required" }, { status: 400 });
  }

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const limit = rateLimiter.check(clientIp);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
      },
    );
  }

  try {
    const { game } = body.matchup;
    const model = body.model || "gemini";
    const cacheKey = `${game.sport}:${game.id}:${model}`;
    const cached = reportCache.get(cacheKey);
 
    if (cached) {
      return NextResponse.json({ report: cached });
    }
 
    const context: BasketballReportContext =
      game.sport === "basketball"
        ? await buildBasketballReportContext(body.matchup)
        : {
            mode: isFinishedGame(game) ? "post-game" : "pre-game",
            home: {
              id: body.matchup.home.id,
              name: body.matchup.home.name,
              recentGames: [],
              headToHead: [],
              players: [],
            },
            away: {
              id: body.matchup.away.id,
              name: body.matchup.away.name,
              recentGames: [],
              headToHead: [],
              players: [],
            },
          };
    const report = await generateScoutReport(body.matchup, context, undefined, model);
    const ttl = isFinishedGame(game) ? ONE_HOUR : TEN_MINUTES;
    reportCache.set(cacheKey, report, ttl);
 
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report failed" },
      { status: 500 },
    );
  }
}
