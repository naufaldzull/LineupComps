import { describe, expect, it, vi } from "vitest";

import { fetchMatchup } from "../matchup-client";

describe("fetchMatchup", () => {
  it("bypasses cached matchup responses", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ matchup: { game: { id: "nba:16871" } } }),
    });

    await fetchMatchup(
      {
        sport: "basketball",
        gameId: "nba:16871",
        mock: false,
      },
      fetcher,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "/api/sports/matchup?sport=basketball&gameId=nba%3A16871&mock=false",
      { cache: "no-store" },
    );
  });
});
