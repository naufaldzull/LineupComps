import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiSportsGet,
  buildBasketballGameMetrics,
  buildMatchupMetrics,
  buildNbaGameMetrics,
  buildNbaTeamMetrics,
  buildRecentForm,
  isFinishedGame,
} from "../api-sports";
import type { ScheduleGame } from "../types";

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

  it("calls the dedicated NBA API with the shared API-SPORTS key", async () => {
    process.env.APISPORTS_KEY = "test-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ response: [] }),
    } as Response);

    await apiSportsGet("nba", "/games", {
      date: "2026-06-08",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://v2.nba.api-sports.io/games?date=2026-06-08",
    );
    expect(init?.headers).toEqual({ "x-apisports-key": "test-key" });
  });
});

describe("matchup scouting builders", () => {
  const game: ScheduleGame = {
    id: "500304",
    sport: "basketball",
    league: "IBL",
    startsAt: "2026-06-08T12:00:00+00:00",
    status: "Not Started",
    homeTeam: {
      id: "pelita",
      name: "Pelita Jaya",
    },
    awayTeam: {
      id: "dewa",
      name: "Dewa United",
    },
  };

  it("builds filled basketball metrics for live matchups without box scores", () => {
    const metrics = buildMatchupMetrics("basketball", game, game.homeTeam.id);

    expect(metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "PTS" }),
        expect.objectContaining({ label: "AST" }),
        expect.objectContaining({ label: "REB" }),
        expect.objectContaining({ label: "FT%" }),
        expect.objectContaining({ label: "FG%" }),
        expect.objectContaining({ label: "3FG%" }),
        expect.objectContaining({ label: "STL" }),
        expect.objectContaining({ label: "BLK" }),
      ]),
    );
    expect(metrics).toHaveLength(8);
    expect(metrics.every((metric) => metric.value > 0)).toBe(true);
    expect(metrics.every((metric) => metric.displayValue)).toBe(true);
  });

  it("builds stable recent form chips", () => {
    expect(buildRecentForm(game, game.homeTeam.id)).toHaveLength(5);
    expect(buildRecentForm(game, game.homeTeam.id)).toEqual(
      buildRecentForm(game, game.homeTeam.id),
    );
  });

  it("maps NBA season totals into compact per-game team metrics", () => {
    expect(
      buildNbaTeamMetrics({
        games: 82,
        points: 9350,
        assists: 2050,
        totReb: 3600,
        ftm: 1500,
        fta: 2000,
        fgm: 3400,
        fga: 7200,
        tpm: 900,
        tpa: 2600,
        steals: 615,
        blocks: 410,
      }),
    ).toEqual([
      { label: "PTS", value: 114, displayValue: "114" },
      { label: "AST", value: 25, displayValue: "25" },
      { label: "REB", value: 43.9, displayValue: "43.9" },
      { label: "FT%", value: 75, displayValue: "75%" },
      { label: "FG%", value: 47.2, displayValue: "47.2%" },
      { label: "3FG%", value: 34.6, displayValue: "34.6%" },
      { label: "STL", value: 7.5, displayValue: "7.5" },
      { label: "BLK", value: 5, displayValue: "5" },
    ]);
  });

  it("detects completed basketball game statuses", () => {
    expect(isFinishedGame({ ...game, status: "FT" })).toBe(true);
    expect(isFinishedGame({ ...game, status: "Game Finished" })).toBe(true);
    expect(isFinishedGame({ ...game, status: "Finished" })).toBe(true);
    expect(isFinishedGame({ ...game, status: "Not Started" })).toBe(false);
  });

  it("maps API-Basketball game statistics into final box-score metrics", () => {
    expect(
      buildBasketballGameMetrics(
        {
          team: { id: 813 },
          field_goals: { total: 30, attempts: 70, percentage: 44 },
          threepoint_goals: { total: 8, attempts: 22, percentage: 36 },
          freethrows_goals: { total: 14, attempts: 21, percentage: 66 },
          rebounds: { total: 47 },
          assists: 18,
          steals: 4,
          blocks: 6,
        },
        82,
      ),
    ).toEqual([
      { label: "PTS", value: 82, displayValue: "82" },
      { label: "AST", value: 18, displayValue: "18" },
      { label: "REB", value: 47, displayValue: "47" },
      { label: "FT%", value: 66, displayValue: "66%" },
      { label: "FG%", value: 44, displayValue: "44%" },
      { label: "3FG%", value: 36, displayValue: "36%" },
      { label: "STL", value: 4, displayValue: "4" },
      { label: "BLK", value: 6, displayValue: "6" },
    ]);
  });

  it("maps API-NBA game statistics into final box-score metrics", () => {
    expect(
      buildNbaGameMetrics({
        team: { id: 5 },
        statistics: [
          {
            points: 141,
            fgm: 54,
            fga: 97,
            fgp: "55.7",
            ftm: 15,
            fta: 23,
            ftp: "65.2",
            tpm: 18,
            tpa: 42,
            tpp: "42.9",
            totReb: 51,
            assists: 36,
            steals: 13,
            blocks: 2,
          },
        ],
      }),
    ).toEqual([
      { label: "PTS", value: 141, displayValue: "141" },
      { label: "AST", value: 36, displayValue: "36" },
      { label: "REB", value: 51, displayValue: "51" },
      { label: "FT%", value: 65.2, displayValue: "65.2%" },
      { label: "FG%", value: 55.7, displayValue: "55.7%" },
      { label: "3FG%", value: 42.9, displayValue: "42.9%" },
      { label: "STL", value: 13, displayValue: "13" },
      { label: "BLK", value: 2, displayValue: "2" },
    ]);
  });
});
