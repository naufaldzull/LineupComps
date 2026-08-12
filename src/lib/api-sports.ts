import { requireEnv } from "./env";
import type { ScheduleGame, Sport, TeamMetric } from "./types";

export type SportsApi = Sport | "nba";

const BASE_URLS: Record<SportsApi, string> = {
  football: "https://v3.football.api-sports.io",
  basketball: "https://v1.basketball.api-sports.io",
  nba: "https://v2.nba.api-sports.io",
};

// Cache tiers for the Next.js Data Cache. The free API-SPORTS plan allows only a
// small number of requests per day, and every revalidation window costs one, so
// endpoints are grouped by how fast their data actually goes stale.
export const REVALIDATE = {
  /** Box scores and team stats while a game is in progress. */
  LIVE: 300,
  /** Daily fixture lists. */
  SCHEDULE: 1800,
  /** Lineups, events, season stats, head-to-head, rosters. */
  STATIC: 21600,
} as const;

const AUTH_ERROR_KEYS = new Set(["token", "access", "key"]);
// `plan` means the subscription tier forbids the parameter, season or date we
// asked for — not that anything ran out. Retrying never helps.
const PLAN_ERROR_KEY = "plan";
// The burst cap ("10 requests per minute"), which clears on its own, as opposed
// to `requests`, which is the daily allowance and does not.
const BURST_ERROR_KEY = "rateLimit";
const DAILY_ERROR_KEY = "requests";

/**
 * The free plan rejects `next`, `last`, and every season outside 2022-2024.
 * Calls that need them are skipped rather than spent and thrown away — each one
 * costs both a daily request and a slot in the 10-per-minute burst budget.
 * Set `APISPORTS_PLAN=paid` after upgrading to enable them.
 */
export function hasPaidApiSportsPlan(): boolean {
  return process.env.APISPORTS_PLAN === "paid";
}

// API-SPORTS reports failures as an `errors` object keyed by cause. Map those
// keys onto messages that are safe to show a visitor; the raw payload only ever
// goes to the server log.
function describeApiSportsError(errors: unknown): string {
  const keys =
    errors && typeof errors === "object" && !Array.isArray(errors)
      ? Object.keys(errors)
      : [];

  if (keys.includes(PLAN_ERROR_KEY)) {
    return "This data is outside our sports data plan.";
  }

  if (keys.includes(BURST_ERROR_KEY)) {
    return "Too many requests right now. Try again in a moment.";
  }

  if (keys.includes(DAILY_ERROR_KEY)) {
    return "Daily live-data limit reached. Try again later.";
  }

  if (keys.some((key) => AUTH_ERROR_KEYS.has(key))) {
    return "Live data unavailable: the sports provider rejected our API key.";
  }

  return "Live data is unavailable right now. Try again later.";
}

export async function apiSportsGet<T>(
  sport: SportsApi,
  path: string,
  params: Record<string, string>,
  revalidate: number = REVALIDATE.SCHEDULE,
): Promise<T> {
  const url = new URL(`${BASE_URLS[sport]}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: { "x-apisports-key": requireEnv("APISPORTS_KEY") },
    next: { revalidate },
  });

  if (!response.ok) {
    console.error("API-SPORTS request failed", {
      sport,
      path,
      status: response.status,
    });

    // A 429 here is the per-minute burst limit, not the daily allowance — the
    // daily one is reported with HTTP 200 and a `requests` error instead.
    throw new Error(
      response.status === 429
        ? "Too many requests right now. Try again in a moment."
        : "Live data is unavailable right now. Try again later.",
    );
  }

  const data = (await response.json()) as T & {
    errors?: unknown;
  };

  // API-SPORTS returns HTTP 200 even on auth/quota errors, with details in `errors`.
  const errors = data.errors;
  const hasErrors = Array.isArray(errors)
    ? errors.length > 0
    : errors && typeof errors === "object" && Object.keys(errors).length > 0;

  if (hasErrors) {
    console.error("API-SPORTS error", { sport, path, errors });

    throw new Error(describeApiSportsError(errors));
  }

  return data;
}

export type NbaTeamStatistics = {
  games?: number;
  points?: number;
  assists?: number;
  totReb?: number;
  fgm?: number;
  fga?: number;
  ftm?: number;
  fta?: number;
  tpm?: number;
  tpa?: number;
  steals?: number;
  blocks?: number;
};

export type BasketballGameStatistics = {
  team: {
    id: number | string;
  };
  field_goals?: {
    total?: number | null;
    attempts?: number | null;
    percentage?: number | null;
  };
  threepoint_goals?: {
    total?: number | null;
    attempts?: number | null;
    percentage?: number | null;
  };
  freethrows_goals?: {
    total?: number | null;
    attempts?: number | null;
    percentage?: number | null;
  };
  rebounds?: {
    total?: number | null;
  };
  assists?: number | null;
  steals?: number | null;
  blocks?: number | null;
};

export type NbaGameStatistics = {
  team: {
    id: number | string;
  };
  statistics?: Array<{
    points?: number | null;
    fgm?: number | null;
    fga?: number | null;
    fgp?: string | number | null;
    ftm?: number | null;
    fta?: number | null;
    ftp?: string | number | null;
    tpm?: number | null;
    tpa?: number | null;
    tpp?: string | number | null;
    totReb?: number | null;
    assists?: number | null;
    steals?: number | null;
    blocks?: number | null;
  }>;
};

function perGame(value: number | undefined, games: number): number {
  return Number(((value ?? 0) / Math.max(1, games)).toFixed(1));
}

function percentage(made: number | undefined, attempted: number | undefined) {
  if (!attempted) {
    return 0;
  }

  return Number((((made ?? 0) / attempted) * 100).toFixed(1));
}

function gamePercentage(
  provided: string | number | null | undefined,
  made: number | null | undefined,
  attempted: number | null | undefined,
) {
  if (provided !== null && provided !== undefined) {
    const value =
      typeof provided === "number" ? provided : Number.parseFloat(provided);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return percentage(made ?? undefined, attempted ?? undefined);
}

function gameMetric(label: string, value: number, suffix = ""): TeamMetric {
  return {
    label,
    value,
    displayValue: `${value}${suffix}`,
  };
}

export type FootballFixtureStatistics = {
  team: { id: number | string };
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
};

export function buildFootballGameMetrics(
  stats: FootballFixtureStatistics,
): TeamMetric[] {
  function stat(type: string): number {
    const entry = stats.statistics.find(
      (s) => s.type.toLowerCase() === type.toLowerCase(),
    );
    if (!entry || entry.value === null) return 0;
    const str = String(entry.value).replace("%", "");
    const num = Number(str);
    return Number.isFinite(num) ? num : 0;
  }

  return [
    gameMetric("Shots", stat("Total Shots")),
    gameMetric("On Target", stat("Shots on Goal")),
    gameMetric("Possession", stat("Ball Possession"), "%"),
    gameMetric("Passes", stat("Total passes")),
    gameMetric("Pass Acc", stat("Passes %"), "%"),
    gameMetric("Fouls", stat("Fouls")),
    gameMetric("Corners", stat("Corner Kicks")),
    gameMetric("Offsides", stat("Offsides")),
  ];
}

export function isLiveGame(game: ScheduleGame): boolean {
  const status = (game.status ?? "").trim().toLowerCase();
  return [
    "1h", "2h", "ht", "et", "bt", "pt", "live", "in play",
    "q1", "q2", "q3", "q4", "ot", "1", "2",
  ].includes(status);
}

export function isFinishedGame(game: ScheduleGame): boolean {
  const status = (game.status ?? "").trim().toLowerCase();

  return [
    "3",
    "aot",
    "after over time",
    "finished",
    "ft",
    "game finished",
  ].includes(status);
}

export function buildBasketballGameMetrics(
  stats: BasketballGameStatistics,
  points: number,
): TeamMetric[] {
  const freeThrow = gamePercentage(
    stats.freethrows_goals?.percentage,
    stats.freethrows_goals?.total,
    stats.freethrows_goals?.attempts,
  );
  const fieldGoal = gamePercentage(
    stats.field_goals?.percentage,
    stats.field_goals?.total,
    stats.field_goals?.attempts,
  );
  const threeFieldGoal = gamePercentage(
    stats.threepoint_goals?.percentage,
    stats.threepoint_goals?.total,
    stats.threepoint_goals?.attempts,
  );

  return [
    gameMetric("PTS", points),
    gameMetric("AST", stats.assists ?? 0),
    gameMetric("REB", stats.rebounds?.total ?? 0),
    gameMetric("FT%", freeThrow, "%"),
    gameMetric("FG%", fieldGoal, "%"),
    gameMetric("3FG%", threeFieldGoal, "%"),
    gameMetric("STL", stats.steals ?? 0),
    gameMetric("BLK", stats.blocks ?? 0),
  ];
}

export function buildNbaGameMetrics(
  response: NbaGameStatistics,
): TeamMetric[] | null {
  const stats = response.statistics?.[0];

  if (!stats) {
    return null;
  }

  return [
    gameMetric("PTS", stats.points ?? 0),
    gameMetric("AST", stats.assists ?? 0),
    gameMetric("REB", stats.totReb ?? 0),
    gameMetric(
      "FT%",
      gamePercentage(stats.ftp, stats.ftm, stats.fta),
      "%",
    ),
    gameMetric(
      "FG%",
      gamePercentage(stats.fgp, stats.fgm, stats.fga),
      "%",
    ),
    gameMetric(
      "3FG%",
      gamePercentage(stats.tpp, stats.tpm, stats.tpa),
      "%",
    ),
    gameMetric("STL", stats.steals ?? 0),
    gameMetric("BLK", stats.blocks ?? 0),
  ];
}

export function buildNbaTeamMetrics(
  stats: NbaTeamStatistics | undefined,
): TeamMetric[] | null {
  if (!stats?.games) {
    return null;
  }

  const games = stats.games;
  const points = perGame(stats.points, games);
  const assists = perGame(stats.assists, games);
  const rebounds = perGame(stats.totReb, games);
  const ft = percentage(stats.ftm, stats.fta);
  const fg = percentage(stats.fgm, stats.fga);
  const threeFg = percentage(stats.tpm, stats.tpa);
  const steals = perGame(stats.steals, games);
  const blocks = perGame(stats.blocks, games);

  return [
    { label: "PTS", value: points, displayValue: `${points}` },
    { label: "AST", value: assists, displayValue: `${assists}` },
    { label: "REB", value: rebounds, displayValue: `${rebounds}` },
    { label: "FT%", value: ft, displayValue: `${ft}%` },
    { label: "FG%", value: fg, displayValue: `${fg}%` },
    { label: "3FG%", value: threeFg, displayValue: `${threeFg}%` },
    { label: "STL", value: steals, displayValue: `${steals}` },
    { label: "BLK", value: blocks, displayValue: `${blocks}` },
  ];
}

export function buildRecentFormFromGames(
  games: ScheduleGame[],
  teamId: string,
  excludedGameId: string,
): string[] | undefined {
  const results = games
    .filter(
      (game) =>
        game.id !== excludedGameId &&
        game.score &&
        isFinishedGame(game) &&
        (game.homeTeam.id === teamId || game.awayTeam.id === teamId),
    )
    .sort(
      (first, second) =>
        new Date(second.startsAt).getTime() -
        new Date(first.startsAt).getTime(),
    )
    .slice(0, 5)
    .reverse()
    .map((game) => {
      const isHome = game.homeTeam.id === teamId;
      const ownScore = isHome ? game.score!.home : game.score!.away;
      const opponentScore = isHome ? game.score!.away : game.score!.home;

      return ownScore === opponentScore
        ? "D"
        : ownScore > opponentScore
          ? "W"
          : "L";
    });

  return results.length > 0 ? results : undefined;
}

export function buildTeamMetricsFromRecentGames(
  sport: Sport,
  games: ScheduleGame[],
  teamId: string,
  excludedGameId: string,
): TeamMetric[] | null {
  const played = games
    .filter(
      (game) =>
        game.id !== excludedGameId &&
        game.score &&
        isFinishedGame(game) &&
        (game.homeTeam.id === teamId || game.awayTeam.id === teamId),
    )
    .sort(
      (first, second) =>
        new Date(second.startsAt).getTime() -
        new Date(first.startsAt).getTime(),
    )
    .slice(0, 10);

  if (played.length === 0) {
    return null;
  }

  let scoredTotal = 0;
  let concededTotal = 0;
  let cleanSheets = 0;
  let wins = 0;

  for (const game of played) {
    const isHome = game.homeTeam.id === teamId;
    const scored = isHome ? game.score!.home : game.score!.away;
    const conceded = isHome ? game.score!.away : game.score!.home;

    scoredTotal += scored;
    concededTotal += conceded;
    if (conceded === 0) {
      cleanSheets += 1;
    }
    if (scored > conceded) {
      wins += 1;
    }
  }

  const count = played.length;
  const round = (value: number) => Number(value.toFixed(1));
  const scoredPerGame = round(scoredTotal / count);
  const concededPerGame = round(concededTotal / count);
  const winRate = round((wins / count) * 100);

  if (sport === "football") {
    const cleanSheetRate = round((cleanSheets / count) * 100);

    return [
      {
        label: "Goals For",
        value: scoredPerGame,
        displayValue: `${scoredPerGame}/game`,
      },
      {
        label: "Goals Against",
        value: concededPerGame,
        displayValue: `${concededPerGame}/game`,
      },
      {
        label: "Clean Sheets",
        value: cleanSheetRate,
        displayValue: `${cleanSheetRate}%`,
      },
      { label: "Win Rate", value: winRate, displayValue: `${winRate}%` },
    ];
  }

  return [
    { label: "PTS", value: scoredPerGame, displayValue: `${scoredPerGame}/game` },
    {
      label: "PTS Against",
      value: concededPerGame,
      displayValue: `${concededPerGame}/game`,
    },
    { label: "Win Rate", value: winRate, displayValue: `${winRate}%` },
  ];
}
