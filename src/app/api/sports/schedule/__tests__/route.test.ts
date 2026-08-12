import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "../route";

function request(query: string): Request {
  return new Request(`http://localhost/api/sports/schedule?${query}`);
}

function fixture(id: string, leagueId: string, leagueName: string) {
  return {
    fixture: { id, date: "2026-08-09T18:00:00+00:00", status: { short: "NS" } },
    league: { id: leagueId, name: leagueName },
    teams: {
      home: { id: "1", name: "Home" },
      away: { id: "2", name: "Away" },
    },
  };
}

describe("GET /api/sports/schedule", () => {
  const originalKey = process.env.APISPORTS_KEY;

  afterEach(() => {
    vi.restoreAllMocks();

    if (originalKey === undefined) {
      delete process.env.APISPORTS_KEY;
    } else {
      process.env.APISPORTS_KEY = originalKey;
    }
  });

  it("rejects an unknown sport", async () => {
    const response = await GET(request("sport=cricket"));

    expect(response.status).toBe(400);
  });

  it("returns every league when hot is not set", async () => {
    process.env.APISPORTS_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        response: [
          fixture("1", "39", "Premier League"),
          fixture("2", "9999", "Regional Cup"),
        ],
      }),
    } as Response);

    const response = await GET(request("sport=football"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.games.map((game: { id: string }) => game.id)).toEqual([
      "1",
      "2",
    ]);
  });

  it("drops games outside the registry when hot=true", async () => {
    process.env.APISPORTS_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        response: [
          fixture("1", "39", "Premier League"),
          fixture("2", "9999", "Regional Cup"),
        ],
      }),
    } as Response);

    const response = await GET(request("sport=football&hot=true"));
    const body = await response.json();

    expect(body.games).toHaveLength(1);
    expect(body.games[0].leagueId).toBe("39");
  });

  it("keeps NBA games under hot=true even without a league id", async () => {
    process.env.APISPORTS_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const isNba = String(input).includes("v2.nba.api-sports.io");

      return {
        ok: true,
        json: async () =>
          isNba
            ? {
                response: [
                  {
                    id: 900,
                    date: { start: "2026-08-09T23:00:00.000Z" },
                    league: "standard",
                    teams: {
                      visitors: { id: "5", name: "Celtics" },
                      home: { id: "14", name: "Lakers" },
                    },
                  },
                ],
              }
            : {
                response: [
                  {
                    id: 700,
                    date: "2026-08-09T20:00:00+00:00",
                    league: { id: "202", name: "Liga A" },
                    teams: {
                      home: { id: "3", name: "Home" },
                      away: { id: "4", name: "Away" },
                    },
                  },
                ],
              },
      } as Response;
    });

    const response = await GET(request("sport=basketball&hot=true"));
    const body = await response.json();

    expect(body.games).toHaveLength(1);
    expect(body.games[0].id).toBe("nba:900");
  });
});
