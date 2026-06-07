import { afterEach, describe, expect, it, vi } from "vitest";

import { apiSportsGet } from "../api-sports";

describe("apiSportsGet", () => {
  const originalKey = process.env.APISPORTS_KEY;

  afterEach(() => {
    vi.restoreAllMocks();

    if (originalKey === undefined) {
      delete process.env.APISPORTS_KEY;
    } else {
      process.env.APISPORTS_KEY = originalKey;
    }
  });

  it("calls the football API with query params and auth header", async () => {
    process.env.APISPORTS_KEY = "test-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ response: [] }),
    } as Response);

    await apiSportsGet("football", "/fixtures", {
      date: "2026-06-07",
      league: "39",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://v3.football.api-sports.io/fixtures?date=2026-06-07&league=39",
    );
    expect(init?.headers).toEqual({ "x-apisports-key": "test-key" });
  });

  it("throws when the upstream API returns an error", async () => {
    process.env.APISPORTS_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
    } as Response);

    await expect(
      apiSportsGet("basketball", "/games", { date: "2026-06-07" }),
    ).rejects.toThrow("API-SPORTS request failed: 429");
  });
});
