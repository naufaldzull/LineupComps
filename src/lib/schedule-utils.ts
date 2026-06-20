import type { ScheduleGame } from "./types";

export type GameCategory = "live" | "finished" | "upcoming";

const FINISHED_STATUSES = new Set([
  "3",
  "aot",
  "after over time",
  "finished",
  "ft",
  "game finished",
]);

const LIVE_STATUSES = new Set([
  "1h",
  "2h",
  "ht",
  "et",
  "bt",
  "pt",
  "live",
  "in play",
  "q1",
  "q2",
  "q3",
  "q4",
  "ot",
  "1",
  "2",
]);

export function categorizeGame(game: ScheduleGame): GameCategory {
  const status = (game.status ?? "").trim().toLowerCase();

  if (FINISHED_STATUSES.has(status)) {
    return "finished";
  }

  if (LIVE_STATUSES.has(status)) {
    return "live";
  }

  return "upcoming";
}

export type CategorizedGames = {
  live: ScheduleGame[];
  finished: ScheduleGame[];
  upcoming: ScheduleGame[];
};

export function groupGamesByCategory(games: ScheduleGame[]): CategorizedGames {
  const result: CategorizedGames = { live: [], finished: [], upcoming: [] };

  for (const game of games) {
    result[categorizeGame(game)].push(game);
  }

  return result;
}

function isNbaLeague(game: ScheduleGame): boolean {
  return /^nba(?:\s|$)/i.test(game.league.trim());
}

export function combineBasketballSchedules(
  nbaGames: ScheduleGame[],
  basketballGames: ScheduleGame[],
  nbaProviderAvailable: boolean,
): ScheduleGame[] {
  const generalGames = nbaProviderAvailable
    ? basketballGames.filter((game) => !isNbaLeague(game))
    : basketballGames;

  return [...nbaGames, ...generalGames];
}
