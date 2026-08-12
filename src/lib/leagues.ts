import type { SportsApi } from "./api-sports";
import { isNbaLeague } from "./schedule-utils";
import type { ScheduleGame, Sport } from "./types";

export type LeagueDef = {
  /** API-SPORTS league id, or the `nba` sentinel for the dedicated NBA API. */
  id: string;
  name: string;
  sport: Sport;
  /** Which upstream API serves this league. */
  apiSport: SportsApi;
  country: string;
  logoUrl?: string;
};

// API-SPORTS hosts league crests at a predictable path, so the registry derives
// them instead of carrying fifteen hand-written URLs.
function leagueLogo(apiSport: "football" | "basketball", id: string): string {
  return `https://media.api-sports.io/${apiSport}/leagues/${id}.png`;
}

function football(id: string, name: string, country: string): LeagueDef {
  return {
    id,
    name,
    sport: "football",
    apiSport: "football",
    country,
    logoUrl: leagueLogo("football", id),
  };
}

const FOOTBALL_LEAGUES: LeagueDef[] = [
  football("1", "FIFA World Cup", "International"),
  football("2", "UEFA Champions League", "Europe"),
  football("3", "UEFA Europa League", "Europe"),
  football("39", "Premier League", "England"),
  football("140", "La Liga", "Spain"),
  football("135", "Serie A", "Italy"),
  football("78", "Bundesliga", "Germany"),
  football("61", "Ligue 1", "France"),
  football("94", "Primeira Liga", "Portugal"),
  football("88", "Eredivisie", "Netherlands"),
  football("253", "MLS", "USA"),
  football("307", "Saudi Pro League", "Saudi Arabia"),
  football("71", "Brasileirão Série A", "Brazil"),
];

const BASKETBALL_LEAGUES: LeagueDef[] = [
  {
    id: "nba",
    name: "NBA",
    sport: "basketball",
    apiSport: "nba",
    country: "USA",
  },
  {
    // API-Basketball files the WNBA under "NBA W". Id 116 is NCAA, not this.
    id: "13",
    name: "WNBA",
    sport: "basketball",
    apiSport: "basketball",
    country: "USA",
    logoUrl: leagueLogo("basketball", "13"),
  },
];

export const HOT_FOOTBALL_LEAGUE_IDS = new Set(
  FOOTBALL_LEAGUES.map((league) => league.id),
);

export const HOT_BASKETBALL_LEAGUE_IDS = new Set(
  BASKETBALL_LEAGUES.map((league) => league.id),
);

export function getLeaguesForSport(sport: Sport): LeagueDef[] {
  return sport === "football" ? FOOTBALL_LEAGUES : BASKETBALL_LEAGUES;
}

export function getLeagueById(
  sport: Sport,
  id: string,
): LeagueDef | undefined {
  return getLeaguesForSport(sport).find((league) => league.id === id);
}

/**
 * True when a game belongs to a curated competition. Matching is by league id
 * because names are not unique across countries — "Serie A" exists in both Italy
 * and Brazil. NBA games are the exception: they come from the dedicated NBA API,
 * which carries no numeric league id, so they are identified by league name.
 */
export function isHotLeague(game: ScheduleGame): boolean {
  if (game.sport === "basketball" && isNbaLeague(game)) {
    return true;
  }

  if (!game.leagueId) {
    return false;
  }

  return game.sport === "football"
    ? HOT_FOOTBALL_LEAGUE_IDS.has(game.leagueId)
    : HOT_BASKETBALL_LEAGUE_IDS.has(game.leagueId);
}
