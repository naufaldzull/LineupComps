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
};

function normalizeTeam(team: ApiSportsTeam): TeamSummary {
  return {
    id: String(team.id),
    name: team.name,
    logoUrl: team.logo,
  };
}

export function normalizeFootballFixture(
  raw: FootballFixturePayload,
): ScheduleGame {
  return {
    id: String(raw.fixture.id),
    sport: "football",
    league: raw.league.name,
    startsAt: raw.fixture.date,
    homeTeam: normalizeTeam(raw.teams.home),
    awayTeam: normalizeTeam(raw.teams.away),
    status: raw.fixture.status?.short,
  };
}

export function normalizeBasketballGame(
  raw: BasketballGamePayload,
): ScheduleGame {
  return {
    id: String(raw.id),
    sport: "basketball",
    league: raw.league.name,
    startsAt: raw.date,
    homeTeam: normalizeTeam(raw.teams.home),
    awayTeam: normalizeTeam(raw.teams.away),
    status: raw.status?.long ?? raw.status?.short,
  };
}

export function normalizeMetricValue(value: number | string): number {
  if (typeof value === "number") {
    return value;
  }

  return Number.parseFloat(value.replace("%", ""));
}
