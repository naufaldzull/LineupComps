import type { ScheduleGame } from "./types";

export type GameCategory = "live" | "finished" | "upcoming";

// Any status that means the result is settled. Football decides matches with
// FT, AET or PEN, and awards them with AWD or WO; basketball uses FT and AOT.
// Note `pen` (shootout decided) is terminal while `p` (shootout in progress),
// listed under live below, is not.
const FINISHED_STATUSES = new Set([
  "3",
  "aet",
  "aot",
  "after over time",
  "awd",
  "finished",
  "ft",
  "game finished",
  "match finished",
  "pen",
  "wo",
]);

const LIVE_STATUSES = new Set([
  // Football short codes
  "1h",
  "2h",
  "ht",
  "et",
  "bt",
  "p",
  "pt",
  "live",
  "in play",
  // Basketball / NBA short codes
  "q1",
  "q2",
  "q3",
  "q4",
  "ot",
  "1",
  "2",
  // Basketball / NBA long-form statuses
  "halftime",
  "overtime",
  "break time",
  "quarter 1",
  "quarter 2",
  "quarter 3",
  "quarter 4",
]);

// Substrings that indicate a game is in progress, covering provider variations
// like "Quarter 1", "1st Quarter", "In Play", "Half Time", "End of Quarter".
const LIVE_KEYWORDS = [
  "quarter",
  "halftime",
  "half time",
  "overtime",
  "in play",
  "break time",
  "playing",
];

const MS_PER_DAY = 86_400_000;

/**
 * Dates to ask the schedule endpoints for, oldest first.
 *
 * The free API-SPORTS plan only serves dates within a day of today — `next`,
 * `last` and older seasons are all rejected — so a window of yesterday through
 * tomorrow is the widest view available. Both the homepage and the league pages
 * request the same dates, which keeps them sharing one set of cached responses.
 */
export function datesAroundToday(radius = 1, now = Date.now()): string[] {
  const dates: string[] = [];

  for (let offset = -radius; offset <= radius; offset += 1) {
    dates.push(new Date(now + offset * MS_PER_DAY).toISOString().slice(0, 10));
  }

  return dates;
}

export function categorizeGame(game: ScheduleGame): GameCategory {
  const status = (game.status ?? "").trim().toLowerCase();

  if (FINISHED_STATUSES.has(status)) {
    return "finished";
  }

  if (
    LIVE_STATUSES.has(status) ||
    LIVE_KEYWORDS.some((keyword) => status.includes(keyword))
  ) {
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

export function isNbaLeague(game: ScheduleGame): boolean {
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
