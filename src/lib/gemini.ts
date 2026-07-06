import { requireEnv } from "./env";
import type {
  BasketballReportContext,
  MatchPrediction,
  Matchup,
  PlayerReportItem,
  StructuredScoutReport,
  TeamScoutReport,
} from "./types";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type GeminiClient = {
  generateContent: (input: string) => Promise<string>;
};

const GEMINI_MODEL = "gemini-2.5-flash";

function wait(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function generateGeminiContent(
  input: string,
  options: { retryDelays?: number[] } = {},
): Promise<string> {
  const retryDelays = options.retryDelays ?? [1500, 3000];

  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": requireEnv("GEMINI_API_KEY"),
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: input }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (response.ok) {
      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim();

      return text || "No scouting report was generated.";
    }

    if (response.status !== 503 || attempt >= retryDelays.length) {
      throw new Error(`Gemini request failed: ${response.status}`);
    }

    await wait(retryDelays[attempt]);
  }
}

export async function generateOpenRouterContent(
  input: string,
  model: string,
): Promise<string> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${requireEnv("OPENROUTER_API_KEY")}`,
        "HTTP-Referer": "https://github.com/naufaldzull/LineupComps",
        "X-Title": "LineupComps",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: input,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const text = data.choices?.[0]?.message?.content?.trim();

  return text || "No scouting report was generated.";
}

function createClient(model = "gemini"): GeminiClient {
  return {
    async generateContent(input: string) {
      try {
        if (model === "gemini") {
          return await generateGeminiContent(input);
        } else {
          return await generateOpenRouterContent(input, model);
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Gemini request failed: 503"
        ) {
          throw new Error(
            "Gemini is temporarily overloaded after automatic retries",
          );
        }

        throw error;
      }
    },
  };
}

function sanitizeText(value: unknown, maxLength = 80): string {
  return String(value)
    .replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions/gi, "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMatchupForPrompt(matchup: Matchup): Matchup {
  return {
    game: {
      id: sanitizeText(matchup.game.id, 40),
      sport: matchup.game.sport,
      league: sanitizeText(matchup.game.league),
      startsAt: sanitizeText(matchup.game.startsAt, 40),
      status: matchup.game.status
        ? sanitizeText(matchup.game.status, 40)
        : undefined,
      score: matchup.game.score
        ? {
            home: matchup.game.score.home,
            away: matchup.game.score.away,
          }
        : undefined,
      homeTeam: {
        id: sanitizeText(matchup.game.homeTeam.id, 40),
        name: sanitizeText(matchup.game.homeTeam.name),
      },
      awayTeam: {
        id: sanitizeText(matchup.game.awayTeam.id, 40),
        name: sanitizeText(matchup.game.awayTeam.name),
      },
    },
    home: {
      id: sanitizeText(matchup.home.id, 40),
      name: sanitizeText(matchup.home.name),
      recentForm: matchup.home.recentForm?.slice(0, 5).map((item) =>
        sanitizeText(item, 4),
      ),
      metrics: matchup.home.metrics.slice(0, 8).map((metric) => ({
        label: sanitizeText(metric.label, 40),
        value: Number.isFinite(metric.value) ? metric.value : 0,
        displayValue: metric.displayValue
          ? sanitizeText(metric.displayValue, 24)
          : undefined,
      })),
    },
    away: {
      id: sanitizeText(matchup.away.id, 40),
      name: sanitizeText(matchup.away.name),
      recentForm: matchup.away.recentForm?.slice(0, 5).map((item) =>
        sanitizeText(item, 4),
      ),
      metrics: matchup.away.metrics.slice(0, 8).map((metric) => ({
        label: sanitizeText(metric.label, 40),
        value: Number.isFinite(metric.value) ? metric.value : 0,
        displayValue: metric.displayValue
          ? sanitizeText(metric.displayValue, 24)
          : undefined,
      })),
    },
    metricsSource: matchup.metricsSource,
  };
}

function sanitizeReportContext(
  context: BasketballReportContext,
): BasketballReportContext {
  const sanitizeTeam = (
    team: BasketballReportContext["home"],
  ): BasketballReportContext["home"] => ({
    id: sanitizeText(team.id, 40),
    name: sanitizeText(team.name),
    recentGames: team.recentGames.slice(0, 3).map((game) => ({
      id: sanitizeText(game.id, 40),
      opponent: sanitizeText(game.opponent),
      result: sanitizeText(game.result, 12),
      score: sanitizeText(game.score, 20),
      startsAt: sanitizeText(game.startsAt, 40),
    })),
    headToHead: team.headToHead.slice(0, 3).map((game) => ({
      id: sanitizeText(game.id, 40),
      opponent: sanitizeText(game.opponent),
      result: sanitizeText(game.result, 12),
      score: sanitizeText(game.score, 20),
      startsAt: sanitizeText(game.startsAt, 40),
    })),
    players: team.players.slice(0, 12).map((player) => ({
      id: sanitizeText(player.id, 40),
      name: sanitizeText(player.name),
      teamId: sanitizeText(player.teamId, 40),
      statLine: sanitizeText(player.statLine, 120),
      baseline: player.baseline
        ? sanitizeText(player.baseline, 120)
        : undefined,
    })),
  });

  return {
    mode: context.mode,
    home: sanitizeTeam(context.home),
    away: sanitizeTeam(context.away),
  };
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => sanitizeText(item, 220))
        .filter(Boolean)
        .slice(0, 4)
    : [];
}

function asPlayerItems(
  value: unknown,
  evidenceByName: Map<string, string>,
): PlayerReportItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => {
      return Boolean(item && typeof item === "object");
    })
    .map((item) => ({
      name: sanitizeText(item.name, 80),
      reason: sanitizeText(item.reason, 220),
      statLine: evidenceByName.get(sanitizeText(item.name, 80)),
    }))
    .filter((item) => evidenceByName.has(item.name) && item.reason)
    .slice(0, 4);
}

function normalizeTeamReport(
  value: unknown,
  context: BasketballReportContext["home"],
): TeamScoutReport {
  const report =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const evidenceByName = new Map(
    context.players.map((player) => [player.name, player.statLine]),
  );

  return {
    teamId: context.id,
    teamName: context.name,
    strengths: asStringArray(report.strengths),
    weaknesses: asStringArray(report.weaknesses),
    recentReview: asStringArray(report.recentReview),
    headToHeadReview: asStringArray(report.headToHeadReview),
    shiningPlayers: asPlayerItems(report.shiningPlayers, evidenceByName),
    strugglingPlayers: asPlayerItems(
      report.strugglingPlayers,
      evidenceByName,
    ),
    underperformedExpectations: asPlayerItems(
      report.underperformedExpectations,
      evidenceByName,
    ),
    exceededExpectations: asPlayerItems(
      report.exceededExpectations,
      evidenceByName,
    ),
    summary:
      typeof report.summary === "string"
        ? sanitizeText(report.summary, 320)
        : "Limited verified data is available for this team.",
  };
}

function safeNum(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePrediction(value: unknown): MatchPrediction | undefined {
  if (!value || typeof value !== "object") return undefined;
  const p = value as Record<string, unknown>;

  const homeWin = safeNum(p.homeWin, 33);
  const draw = safeNum(p.draw, 34);
  const awayWin = safeNum(p.awayWin, 33);

  const ou = p.overUnder && typeof p.overUnder === "object"
    ? (p.overUnder as Record<string, unknown>)
    : {};
  const btts = p.btts && typeof p.btts === "object"
    ? (p.btts as Record<string, unknown>)
    : {};

  const scorePredictions = Array.isArray(p.scorePredictions)
    ? p.scorePredictions
        .filter(
          (s): s is Record<string, unknown> =>
            !!s && typeof s === "object" && typeof (s as Record<string, unknown>).score === "string",
        )
        .map((s) => ({
          score: sanitizeText(s.score, 10),
          confidence: safeNum(s.confidence),
        }))
        .slice(0, 3)
    : [];

  const risk = String(p.riskRating ?? "medium").toLowerCase();

  return {
    homeWin,
    draw,
    awayWin,
    overUnder: {
      line: safeNum(ou.line, 2.5),
      over: safeNum(ou.over, 50),
      under: safeNum(ou.under, 50),
    },
    btts: {
      yes: safeNum(btts.yes, 50),
      no: safeNum(btts.no, 50),
    },
    scorePredictions,
    firstGoalscorer:
      typeof p.firstGoalscorer === "string" && p.firstGoalscorer
        ? sanitizeText(p.firstGoalscorer, 80)
        : undefined,
    riskRating: (["low", "medium", "high"].includes(risk)
      ? risk
      : "medium") as MatchPrediction["riskRating"],
    riskReason:
      typeof p.riskReason === "string"
        ? sanitizeText(p.riskReason, 200)
        : "",
    verdict:
      typeof p.verdict === "string"
        ? sanitizeText(p.verdict, 200)
        : "",
  };
}

function escapeControlCharactersInJson(jsonStr: string): string {
  let result = "";
  let insideString = false;
  let isEscaped = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (char === '"' && !isEscaped) {
      insideString = !insideString;
    }

    if (insideString) {
      if (char === '\\') {
        isEscaped = !isEscaped;
      } else {
        isEscaped = false;
      }

      if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else {
        const code = char.charCodeAt(0);
        if (code < 32) {
          // Ignore control characters
        } else {
          result += char;
        }
      }
    } else {
      isEscaped = false;
      result += char;
    }
  }

  return result;
}

function parseStructuredReport(
  raw: string,
  context: BasketballReportContext,
): StructuredScoutReport {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const sanitized = escapeControlCharactersInJson(cleaned);
  const value = JSON.parse(sanitized) as Record<string, unknown>;

  return {
    mode: context.mode,
    home: normalizeTeamReport(value.home, context.home),
    away: normalizeTeamReport(value.away, context.away),
    matchupSummary:
      typeof value.matchupSummary === "string"
        ? sanitizeText(value.matchupSummary, 360)
        : "The available evidence does not support a broader matchup summary.",
    prediction:
      context.mode === "pre-game"
        ? normalizePrediction(value.prediction)
        : undefined,
  };
}

export async function generateScoutReport(
  matchup: Matchup,
  context: BasketballReportContext,
  client?: GeminiClient,
  model = "gemini",
): Promise<StructuredScoutReport> {
  const actualClient = client ?? createClient(model);
  const sanitizedMatchup = sanitizeMatchupForPrompt(matchup);
  const sanitizedContext = sanitizeReportContext(context);
  const modeInstructions =
    context.mode === "post-game"
      ? [
          "Analyze what happened in this completed game.",
          "Identify players who shined or struggled from actual game evidence.",
          "Only classify exceeded or underperformed expectations when both an actual stat line and baseline are present.",
          "Do not include recentReview or headToHeadReview unless the context contains those games.",
        ]
      : [
          "Write a pre-game forecast with statistical predictions.",
          "Review up to three recent games and up to three head-to-head games.",
          "Identify players likely to shine or struggle using only supplied player baselines.",
          "Leave post-game expectation arrays empty.",
          'Include a "prediction" object with: homeWin/draw/awayWin (percentages summing to 100), overUnder (line e.g. 2.5, over/under percentages summing to 100), btts (yes/no percentages summing to 100), scorePredictions (top 3 most likely scores with confidence %), firstGoalscorer (player name from the data or null), riskRating ("low"/"medium"/"high"), riskReason (1 sentence why), verdict (1 sentence pick summary).',
          "Base predictions on the team metrics, recent form, and head-to-head data provided.",
        ];
  const input = [
    "You are a basketball analyst writing a concise evidence-based scouting report.",
    "Use only the normalized matchup data below.",
    "Provide statistical match predictions for pre-game analysis. Do not reference specific bookmaker odds.",
    "Never invent a player name. A player may appear only if included in the matching team's players array.",
    "Return valid JSON only, without markdown fences.",
    'Use this shape: {"mode":"pre-game|post-game","home":{"teamId":"","teamName":"","strengths":[],"weaknesses":[],"recentReview":[],"headToHeadReview":[],"shiningPlayers":[{"name":"","reason":"","statLine":""}],"strugglingPlayers":[],"underperformedExpectations":[],"exceededExpectations":[],"summary":""},"away":{same fields},"matchupSummary":"","prediction":{"homeWin":0,"draw":0,"awayWin":0,"overUnder":{"line":2.5,"over":0,"under":0},"btts":{"yes":0,"no":0},"scorePredictions":[{"score":"1-0","confidence":0}],"firstGoalscorer":"name or null","riskRating":"low|medium|high","riskReason":"","verdict":""}}. Omit prediction for post-game reports.',
    ...modeInstructions,
    "",
    JSON.stringify(
      { matchup: sanitizedMatchup, reportContext: sanitizedContext },
      null,
      2,
    ),
  ].join("\n");

  return parseStructuredReport(await actualClient.generateContent(input), context);
}
