import type { ScheduleGame, TeamSummary } from "./types";

type ApiSportsTeam = {
  id: number | string;
  name: string;
  logo?: string;
};

type FootballFixturePayload = {
  fixture: {
    id: number | string;
    date: string;
    status?: {
      short?: string;
    };
  };
  league: {
    name: string;
  };
  teams: {
    home: ApiSportsTeam;
    away: ApiSportsTeam;
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
};

type BasketballGamePayload = {
  id: number | string;
  date: string;
  status?: {
    long?: string;
    short?: string;
  };
  league: {
    name: string;
  };
  teams: {
    home: ApiSportsTeam;
    away: ApiSportsTeam;
  };
  scores?: {
    home?: {
      total?: number | null;
    };
    away?: {
      total?: number | null;
    };
  };
};

type NbaGamePayload = {
  id: number | string;
  date: {
    start?: string;
  };
  status?: {
    long?: string;
    short?: string | number;
  };
  league?: string;
  teams: {
    visitors: ApiSportsTeam;
    home: ApiSportsTeam;
  };
  scores?: {
    visitors?: {
      points?: number | null;
    };
    home?: {
      points?: number | null;
    };
  };
};

function normalizeTeam(team: ApiSportsTeam): TeamSummary {
  return {
    id: String(team.id),
    name: team.name,
    logoUrl: team.logo,
  };
}

function normalizeScore(
  home?: number | null,
  away?: number | null,
): ScheduleGame["score"] {
  if (typeof home !== "number" || typeof away !== "number") {
    return undefined;
  }

  return { home, away };
}

export function normalizeFootballFixture(
  raw: FootballFixturePayload,
): ScheduleGame {
  const score = normalizeScore(raw.goals?.home, raw.goals?.away);

  return {
    id: String(raw.fixture.id),
    sport: "football",
    league: raw.league.name,
    startsAt: raw.fixture.date,
    homeTeam: normalizeTeam(raw.teams.home),
    awayTeam: normalizeTeam(raw.teams.away),
    status: raw.fixture.status?.short,
    ...(score ? { score } : {}),
  };
}

export function normalizeBasketballGame(
  raw: BasketballGamePayload,
): ScheduleGame {
  const score = normalizeScore(
    raw.scores?.home?.total,
    raw.scores?.away?.total,
  );

  return {
    id: String(raw.id),
    sport: "basketball",
    league: raw.league.name,
    startsAt: raw.date,
    homeTeam: normalizeTeam(raw.teams.home),
    awayTeam: normalizeTeam(raw.teams.away),
    status: raw.status?.long ?? raw.status?.short,
    ...(score ? { score } : {}),
  };
}

export function normalizeNbaGame(raw: NbaGamePayload): ScheduleGame {
  const score = normalizeScore(
    raw.scores?.home?.points,
    raw.scores?.visitors?.points,
  );

  return {
    id: `nba:${String(raw.id)}`,
    sport: "basketball",
    league: raw.league ? `NBA ${raw.league}` : "NBA",
    startsAt: raw.date.start ?? new Date().toISOString(),
    homeTeam: normalizeTeam(raw.teams.home),
    awayTeam: normalizeTeam(raw.teams.visitors),
    status:
      raw.status?.long ??
      (raw.status?.short === undefined ? undefined : String(raw.status.short)),
    ...(score ? { score } : {}),
  };
}

export function normalizeMetricValue(value: number | string): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsedValue = Number.parseFloat(value.replace("%", ""));

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}
