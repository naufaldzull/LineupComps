import { describe, expect, it } from "vitest";

import {
  normalizeBasketballGame,
  normalizeFootballFixture,
  normalizeMetricValue,
} from "../normalizers";

describe("sports normalizers", () => {
  it("maps an API-SPORTS football fixture into a schedule game", () => {
    const raw = {
      fixture: {
        id: 123456,
        date: "2026-06-14T19:00:00+00:00",
        status: {
          short: "NS",
        },
      },
      league: {
        name: "Premier League",
      },
      teams: {
        home: {
          id: 33,
          name: "Manchester United",
          logo: "https://media.api-sports.io/football/teams/33.png",
        },
        away: {
          id: 40,
          name: "Liverpool",
          logo: "https://media.api-sports.io/football/teams/40.png",
        },
      },
    };

    expect(normalizeFootballFixture(raw)).toEqual({
      id: "123456",
      sport: "football",
      league: "Premier League",
      startsAt: "2026-06-14T19:00:00+00:00",
      status: "NS",
      homeTeam: {
        id: "33",
        name: "Manchester United",
        logoUrl: "https://media.api-sports.io/football/teams/33.png",
      },
      awayTeam: {
        id: "40",
        name: "Liverpool",
        logoUrl: "https://media.api-sports.io/football/teams/40.png",
      },
    });
  });

  it("maps an API-SPORTS basketball game into a schedule game", () => {
    const raw = {
      id: 98765,
      date: "2026-06-15T01:30:00+00:00",
      status: {
        long: "Not Started",
        short: "NS",
      },
      league: {
        name: "NBA",
      },
      teams: {
        home: {
          id: 137,
          name: "Boston Celtics",
          logo: "https://media.api-sports.io/basketball/teams/137.png",
        },
        away: {
          id: 138,
          name: "Los Angeles Lakers",
          logo: "https://media.api-sports.io/basketball/teams/138.png",
        },
      },
    };

    expect(normalizeBasketballGame(raw)).toEqual({
      id: "98765",
      sport: "basketball",
      league: "NBA",
      startsAt: "2026-06-15T01:30:00+00:00",
      status: "Not Started",
      homeTeam: {
        id: "137",
        name: "Boston Celtics",
        logoUrl: "https://media.api-sports.io/basketball/teams/137.png",
      },
      awayTeam: {
        id: "138",
        name: "Los Angeles Lakers",
        logoUrl: "https://media.api-sports.io/basketball/teams/138.png",
      },
    });
  });

  it("normalizes metric strings into numbers", () => {
    expect(normalizeMetricValue("58.4%")).toBe(58.4);
    expect(normalizeMetricValue("42")).toBe(42);
    expect(normalizeMetricValue(12.5)).toBe(12.5);
  });

  it("normalizes unavailable metric values to zero", () => {
    expect(normalizeMetricValue("")).toBe(0);
    expect(normalizeMetricValue("-")).toBe(0);
    expect(normalizeMetricValue("N/A")).toBe(0);
    expect(normalizeMetricValue("not available")).toBe(0);
  });
});
