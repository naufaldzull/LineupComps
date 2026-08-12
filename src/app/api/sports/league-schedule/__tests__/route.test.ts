import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "../route";

function request(query: string): Request {
  return new Request(`http://localhost/api/sports/league-schedule?${query}`);
}

function fixture(id: string, date: string) {
  return {
    fixture: { id, date, status: { short: "NS" } },
    league: { id: "39", name: "Premier League" },
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

  it("merges next and last football fixtures, deduped and sorted", async () => {
    process.env.APISPORTS_KEY = "test-key";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const isUpcoming = String(input).includes("next=15");

        return {
          ok: true,
          json: async () => ({
            response: isUpcoming
              ? [
                  fixture("300", "2026-08-20T18:00:00+00:00"),
                  fixture("200", "2026-08-15T18:00:00+00:00"),
                ]
              : [
                  fixture("100", "2026-08-01T18:00:00+00:00"),
                  // Same fixture the upcoming call already returned.
                  fixture("200", "2026-08-15T18:00:00+00:00"),
                ],
          }),
        } as Response;
      });

    const response = await GET(request("sport=football&leagueId=39"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.games.map((game: { id: string }) => game.id)).toEqual([
      "100",
      "200",
      "300",
    ]);

    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(urls.some((url) => url.includes("league=39&next=15"))).toBe(true);
    expect(urls.some((url) => url.includes("league=39&last=5"))).toBe(true);
  });

  it("queries the dedicated NBA API for the nba sentinel", async () => {
    process.env.APISPORTS_KEY = "test-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ response: [] }),
    } as Response);

    await GET(request("sport=basketball&leagueId=nba"));

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("v2.nba.api-sports.io/games");
    expect(url).not.toContain("league=");
  });

  it("queries API-Basketball with the league id for WNBA", async () => {
    process.env.APISPORTS_KEY = "test-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ response: [] }),
    } as Response);

    await GET(request("sport=basketball&leagueId=116"));

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("v1.basketball.api-sports.io/games");
    expect(url).toContain("league=116");
  });

  it("serves mock fixtures without calling upstream", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const response = await GET(
      request("sport=football&leagueId=39&mock=true"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.games.length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
