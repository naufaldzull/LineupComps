import type { ScheduleGame } from "./types";

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
