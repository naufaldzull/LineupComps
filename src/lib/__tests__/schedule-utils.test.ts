import { describe, expect, it } from "vitest";

import { combineBasketballSchedules } from "../schedule-utils";
import type { ScheduleGame } from "../types";

const baseGame: ScheduleGame = {
  id: "game",
  sport: "basketball",
  league: "NBA",
  startsAt: "2026-06-09T00:30:00.000Z",
  homeTeam: { id: "home", name: "New York Knicks" },
  awayTeam: { id: "away", name: "San Antonio Spurs" },
};

describe("combineBasketballSchedules", () => {
  it("removes API-Basketball NBA duplicates when API-NBA succeeds", () => {
    const games = combineBasketballSchedules(
      [{ ...baseGame, id: "nba:16871", league: "NBA standard" }],
      [
        { ...baseGame, id: "500299" },
        { ...baseGame, id: "other", league: "BBL" },
      ],
      true,
    );

    expect(games.map((game) => game.id)).toEqual(["nba:16871", "other"]);
  });

  it("keeps API-Basketball NBA games when API-NBA is unavailable", () => {
    expect(
      combineBasketballSchedules([], [{ ...baseGame, id: "500299" }], false),
    ).toHaveLength(1);
  });
});
