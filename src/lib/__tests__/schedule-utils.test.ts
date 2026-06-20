import { describe, expect, it } from "vitest";

import {
  categorizeGame,
  combineBasketballSchedules,
  groupGamesByCategory,
} from "../schedule-utils";
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

describe("categorizeGame", () => {
  it("categorizes finished games", () => {
    expect(categorizeGame({ ...baseGame, status: "FT" })).toBe("finished");
    expect(categorizeGame({ ...baseGame, status: "Finished" })).toBe("finished");
    expect(categorizeGame({ ...baseGame, status: "AOT" })).toBe("finished");
  });

  it("categorizes live games", () => {
    expect(categorizeGame({ ...baseGame, status: "HT" })).toBe("live");
    expect(categorizeGame({ ...baseGame, status: "Q3" })).toBe("live");
    expect(categorizeGame({ ...baseGame, status: "1H" })).toBe("live");
  });

  it("categorizes upcoming games", () => {
    expect(categorizeGame({ ...baseGame, status: "Not Started" })).toBe("upcoming");
    expect(categorizeGame({ ...baseGame })).toBe("upcoming");
  });
});

describe("groupGamesByCategory", () => {
  it("groups games into live, finished, and upcoming", () => {
    const games: ScheduleGame[] = [
      { ...baseGame, id: "1", status: "HT" },
      { ...baseGame, id: "2", status: "FT" },
      { ...baseGame, id: "3", status: "Not Started" },
      { ...baseGame, id: "4", status: "Q2" },
    ];

    const result = groupGamesByCategory(games);
    expect(result.live.map((g) => g.id)).toEqual(["1", "4"]);
    expect(result.finished.map((g) => g.id)).toEqual(["2"]);
    expect(result.upcoming.map((g) => g.id)).toEqual(["3"]);
  });
});
