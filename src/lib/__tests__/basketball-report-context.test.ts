import { describe, expect, it } from "vitest";

import {
  normalizeBasketballPlayerGroups,
  normalizeNbaPlayerRows,
  selectGameEvidence,
  selectTopPlayerEvidence,
} from "../basketball-report-context";
import type { ScheduleGame } from "../types";

describe("basketball report context", () => {
  it("normalizes flat NBA player rows with real stat evidence", () => {
    const players = normalizeNbaPlayerRows([
      {
        player: { id: 1, firstname: "Alyssa", lastname: "Thomas" },
        team: { id: 10 },
        points: 21,
        totReb: 11,
        assists: 8,
        steals: 2,
        blocks: 1,
      },
    ]);

    expect(players).toEqual([
      {
        id: "1",
        name: "Alyssa Thomas",
        teamId: "10",
        statLine: "21 PTS · 11 REB · 8 AST · 2 STL · 1 BLK",
      },
    ]);
  });

  it("normalizes grouped API-Basketball player statistics", () => {
    const players = normalizeBasketballPlayerGroups([
      {
        team: { id: 20 },
        players: [
          {
            player: { id: 2, name: "Player Two" },
            statistics: [
              { points: 18, rebounds: 7, assists: 5, steals: 1, blocks: 0 },
            ],
          },
        ],
      },
    ]);

    expect(players[0]).toEqual({
      id: "2",
      name: "Player Two",
      teamId: "20",
      statLine: "18 PTS · 7 REB · 5 AST · 1 STL · 0 BLK",
    });
  });

  it("normalizes flat API-Basketball game player rows", () => {
    const players = normalizeBasketballPlayerGroups([
      {
        game: { id: 500299 },
        team: { id: 151 },
        player: { id: 865, name: "Anunoby Ogugua" },
        points: 28,
        rebounds: { total: 5 },
        assists: 1,
        steals: 0,
        blocks: 2,
      },
    ]);

    expect(players).toEqual([
      {
        id: "865",
        name: "Anunoby Ogugua",
        teamId: "151",
        statLine: "28 PTS · 5 REB · 1 AST · 0 STL · 2 BLK",
      },
    ]);
  });

  it("selects the latest three games and derives results for one team", () => {
    const games: ScheduleGame[] = [1, 2, 3, 4].map((index) => ({
      id: String(index),
      sport: "basketball",
      league: "NBA",
      startsAt: `2026-06-0${index}T12:00:00.000Z`,
      status: "Finished",
      homeTeam: { id: "10", name: "Home" },
      awayTeam: { id: `2${index}`, name: `Opponent ${index}` },
      score: { home: 80 + index, away: 70 + index },
    }));

    expect(selectGameEvidence(games, "10", "current")).toHaveLength(3);
    expect(selectGameEvidence(games, "10", "current")[0]).toMatchObject({
      id: "4",
      result: "W",
      score: "84-74",
      opponent: "Opponent 4",
    });
  });

  it("keeps only the six highest-impact players for the AI prompt", () => {
    const players = Array.from({ length: 7 }, (_, index) => ({
      id: String(index),
      name: `Player ${index}`,
      teamId: "10",
      statLine: `${index * 5} PTS · ${index} REB · ${index} AST · 0 STL · 0 BLK`,
    }));

    const selected = selectTopPlayerEvidence(players);

    expect(selected).toHaveLength(6);
    expect(selected.map((player) => player.name)).not.toContain("Player 0");
    expect(selected[0].name).toBe("Player 6");
  });
});
