import { describe, expect, it } from "vitest";

import {
  getLeagueById,
  getLeaguesForSport,
  isHotLeague,
} from "../leagues";
import type { ScheduleGame } from "../types";

function game(overrides: Partial<ScheduleGame>): ScheduleGame {
  return {
    id: "1",
    sport: "football",
    league: "Premier League",
    startsAt: "2026-08-09T18:00:00Z",
    homeTeam: { id: "1", name: "Home" },
    awayTeam: { id: "2", name: "Away" },
    ...overrides,
  };
}

describe("getLeaguesForSport", () => {
  it("returns the curated football competitions", () => {
    const leagues = getLeaguesForSport("football");

    expect(leagues).toHaveLength(13);
    expect(leagues.map((league) => league.name)).toContain("Premier League");
    expect(leagues.every((league) => league.sport === "football")).toBe(true);
  });

  it("returns NBA and WNBA for basketball, routed to their own APIs", () => {
    const leagues = getLeaguesForSport("basketball");

    expect(leagues.map((league) => league.id)).toEqual(["nba", "116"]);
    expect(leagues[0].apiSport).toBe("nba");
    expect(leagues[1].apiSport).toBe("basketball");
  });
});

describe("getLeagueById", () => {
  it("finds a league within its own sport", () => {
    expect(getLeagueById("football", "39")?.name).toBe("Premier League");
    expect(getLeagueById("basketball", "nba")?.name).toBe("NBA");
  });

  it("does not match an id from the other sport", () => {
    expect(getLeagueById("basketball", "39")).toBeUndefined();
    expect(getLeagueById("football", "nba")).toBeUndefined();
  });
});

describe("isHotLeague", () => {
  it("accepts a registry football league", () => {
    expect(isHotLeague(game({ leagueId: "39" }))).toBe(true);
  });

  it("rejects a football league outside the registry", () => {
    expect(
      isHotLeague(game({ leagueId: "9999", league: "Regional Cup" })),
    ).toBe(false);
  });

  it("rejects a game with no league id", () => {
    expect(isHotLeague(game({ league: "Premier League" }))).toBe(false);
  });

  it("accepts NBA games, which carry no numeric league id", () => {
    expect(
      isHotLeague(
        game({ id: "nba:1", sport: "basketball", league: "NBA", leagueId: undefined }),
      ),
    ).toBe(true);
  });

  it("accepts WNBA by id", () => {
    expect(
      isHotLeague(game({ sport: "basketball", league: "WNBA", leagueId: "116" })),
    ).toBe(true);
  });

  it("rejects a minor basketball league", () => {
    expect(
      isHotLeague(
        game({ sport: "basketball", league: "Liga A", leagueId: "202" }),
      ),
    ).toBe(false);
  });

  it("does not treat a football league id as a basketball one", () => {
    expect(
      isHotLeague(game({ sport: "basketball", league: "Serie A", leagueId: "135" })),
    ).toBe(false);
  });
});
