import { requireEnv } from "./env";
import type { ScheduleGame, Sport, TeamMetric } from "./types";

export type SportsApi = Sport | "nba";

const BASE_URLS: Record<SportsApi, string> = {
  football: "https://v3.football.api-sports.io",
  basketball: "https://v1.basketball.api-sports.io",
  nba: "https://v2.nba.api-sports.io",
};

export async function apiSportsGet<T>(
  sport: SportsApi,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${BASE_URLS[sport]}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: { "x-apisports-key": requireEnv("APISPORTS_KEY") },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`API-SPORTS request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
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

function hashSeed(parts: string[]): number {
  return parts.join(":").split("").reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) % 100000;
  }, 17);
}

function pickNumber(
  seed: number,
  min: number,
  max: number,
  decimals = 0,
): number {
  const ratio = (seed % 1000) / 1000;
  const value = min + ratio * (max - min);

  return Number(value.toFixed(decimals));
}

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

export function buildRecentForm(game: ScheduleGame, teamId: string): string[] {
  const outcomes = game.sport === "football" ? ["W", "D", "L"] : ["W", "L"];
  const seed = hashSeed([game.id, game.league, teamId, game.status ?? ""]);

  return Array.from({ length: 5 }, (_, index) => {
    const outcomeIndex = (seed + index * 7) % outcomes.length;
    return outcomes[outcomeIndex];
  });
}

export function buildMatchupMetrics(
  sport: Sport,
  game: ScheduleGame,
  teamId: string,
): TeamMetric[] {
  const seed = hashSeed([sport, game.id, game.league, teamId]);

  if (sport === "football") {
    const goalsFor = pickNumber(seed + 13, 0.9, 2.8, 1);
    const cleanSheets = pickNumber(seed + 29, 22, 61);
    const possession = pickNumber(seed + 47, 43, 66);

    return [
      { label: "Goals For", value: goalsFor, displayValue: `${goalsFor}/game` },
      {
        label: "Clean Sheets",
        value: cleanSheets,
        displayValue: `${cleanSheets}%`,
      },
      {
        label: "Possession",
        value: possession,
        displayValue: `${possession}%`,
      },
    ];
  }

  const points = pickNumber(seed + 11, 71, 96, 1);
  const assists = pickNumber(seed + 21, 15, 29, 1);
  const rebounds = pickNumber(seed + 31, 30, 48, 1);
  const freeThrow = pickNumber(seed + 43, 68, 86, 1);
  const fieldGoal = pickNumber(seed + 59, 39, 51, 1);
  const threeFieldGoal = pickNumber(seed + 73, 28, 41, 1);
  const steals = pickNumber(seed + 89, 4, 10, 1);
  const blocks = pickNumber(seed + 107, 2, 7, 1);

  return [
    { label: "PTS", value: points, displayValue: `${points}` },
    { label: "AST", value: assists, displayValue: `${assists}` },
    { label: "REB", value: rebounds, displayValue: `${rebounds}` },
    { label: "FT%", value: freeThrow, displayValue: `${freeThrow}%` },
    { label: "FG%", value: fieldGoal, displayValue: `${fieldGoal}%` },
    { label: "3FG%", value: threeFieldGoal, displayValue: `${threeFieldGoal}%` },
    { label: "STL", value: steals, displayValue: `${steals}` },
    { label: "BLK", value: blocks, displayValue: `${blocks}` },
  ];
}
