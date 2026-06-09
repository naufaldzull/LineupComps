import { NextResponse } from "next/server";

import { buildBasketballReportContext } from "@/lib/basketball-report-context";
import { generateScoutReport } from "@/lib/gemini";
import { isFinishedGame } from "@/lib/api-sports";
import type { BasketballReportContext, Matchup } from "@/lib/types";

type ScoutReportRequest = {
  matchup?: Matchup;
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

  try {
    const context: BasketballReportContext =
      body.matchup.game.sport === "basketball"
        ? await buildBasketballReportContext(body.matchup)
        : {
            mode: isFinishedGame(body.matchup.game)
              ? "post-game"
              : "pre-game",
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
    const report = await generateScoutReport(body.matchup, context);

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report failed" },
      { status: 500 },
    );
  }
}
