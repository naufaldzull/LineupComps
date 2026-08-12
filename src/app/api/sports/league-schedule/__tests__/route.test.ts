import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "../route";

function request(query: string): Request {
  return new Request(`http://localhost/api/sports/league-schedule?${query}`);
}

function fixture(id: string, leagueId: string, date: string) {
  return {
    fixture: { id, date, status: { short: "NS" } },
    league: { id: leagueId, name: "Some League" },
    teams: {
      home: { id: "1", name: "Home" },
      away: { id: "2", name: "Away" },
    },
  };
}

describe("GET /api/sports/league-schedule", () => {
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
    expect((await GET(request("sport=cricket&leagueId=39"))).status).toBe(400);
  });

  it("rejects a missing leagueId", async () => {
    expect((await GET(request("sport=football"))).status).toBe(400);
  });

  it("rejects a league outside the registry", async () => {
    const response = await GET(request("sport=football&leagueId=9999"));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Unknown league");
  });

  it("rejects a basketball id requested under football", async () => {
    expect((await GET(request("sport=football&leagueId=nba"))).status).toBe(400);
  });

  // The free plan blocks `next`, `last` and any season outside 2022-2024, so the
  // route may only ever query by date.
  it("queries by date only, never by next/last/season/league", async () => {
    process.env.APISPORTS_KEY = "test-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ response: [] }),
    } as Response);

    await GET(request("sport=football&leagueId=39"));

    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(urls).toHaveLength(3);

    for (const url of urls) {
      expect(url).toMatch(/\/fixtures\?date=\d{4}-\d{2}-\d{2}$/);
    }

    // Three distinct days: yesterday, today, tomorrow.
    expect(new Set(urls).size).toBe(3);
  });

  it("keeps only fixtures from the requested league, sorted and deduped", async () => {
    process.env.APISPORTS_KEY = "test-key";
    let call = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      // The three days run concurrently, so pin the number now — reading `call`
      // inside json() would see whatever the last invocation left behind.
      const day = (call += 1);

      return {
        ok: true,
        json: async () => ({
          response:
            day === 1
              ? [
                  fixture("300", "39", "2026-08-20T18:00:00+00:00"),
                  fixture("900", "9999", "2026-08-19T18:00:00+00:00"),
                ]
              : day === 2
                ? [
                    fixture("100", "39", "2026-08-01T18:00:00+00:00"),
                    // Duplicate of the fixture the first day already returned.
                    fixture("300", "39", "2026-08-20T18:00:00+00:00"),
                  ]
                : [fixture("200", "39", "2026-08-15T18:00:00+00:00")],
        }),
      } as Response;
    });

    const body = await (
      await GET(request("sport=football&leagueId=39"))
    ).json();

    expect(body.games.map((game: { id: string }) => game.id)).toEqual([
      "100",
      "200",
      "300",
    ]);
  });

  it("survives one day failing upstream", async () => {
    process.env.APISPORTS_KEY = "test-key";
    vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      const day = (call += 1);

      if (day === 2) {
        return { ok: false, status: 500 } as Response;
      }

      return {
        ok: true,
        json: async () => ({
          response: [fixture(`g${day}`, "39", "2026-08-15T18:00:00+00:00")],
        }),
      } as Response;
    });

    const response = await GET(request("sport=football&leagueId=39"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.games).toHaveLength(2);
  });

  it("queries the dedicated NBA API for the nba sentinel", async () => {
    process.env.APISPORTS_KEY = "test-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ response: [] }),
    } as Response);

    await GET(request("sport=basketball&leagueId=nba"));

    for (const [input] of fetchMock.mock.calls) {
      expect(String(input)).toContain("v2.nba.api-sports.io/games?date=");
    }
  });

  it("queries API-Basketball and filters to WNBA", async () => {
    process.env.APISPORTS_KEY = "test-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        response: [
          {
            id: 1,
            date: "2026-08-12T20:00:00+00:00",
            league: { id: "13", name: "NBA W" },
            teams: {
              home: { id: "1", name: "Aces" },
              away: { id: "2", name: "Liberty" },
            },
          },
          {
            id: 2,
            date: "2026-08-12T20:00:00+00:00",
            league: { id: "116", name: "NCAA" },
            teams: {
              home: { id: "3", name: "Duke" },
              away: { id: "4", name: "UNC" },
            },
          },
        ],
      }),
    } as Response);

    const body = await (
      await GET(request("sport=basketball&leagueId=13"))
    ).json();

    for (const [input] of fetchMock.mock.calls) {
      expect(String(input)).toContain("v1.basketball.api-sports.io/games?date=");
    }

    expect(body.games).toHaveLength(1);
    expect(body.games[0].leagueId).toBe("13");
  });

  it("serves mock fixtures without calling upstream", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const response = await GET(request("sport=football&leagueId=39&mock=true"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.games.length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
