import { describe, expect, it } from "vitest";

import {
  normalizeBasketballRoster,
  normalizeFootballLineup,
} from "../player-roster";

describe("player roster normalizer", () => {
  it("normalizes API-Basketball roster rows and limits them to six", () => {
    const players = normalizeBasketballRoster(
      Array.from({ length: 8 }, (_, index) => ({
        id: index + 1,
        name: `Player ${index + 1}`,
        number: index === 0 ? "34" : null,
        position: index === 0 ? "Forward" : null,
        country: index === 0 ? "USA" : null,
      })),
    );

    expect(players).toHaveLength(6);
    expect(players[0]).toEqual({
      id: "1",
      name: "Player 1",
      number: "34",
      position: "Forward",
      country: "USA",
    });
  });

  it("drops invalid and duplicate roster rows", () => {
    expect(
      normalizeBasketballRoster([
        { id: 1, name: "Player One" },
        { id: 1, name: "Player One" },
        { id: 2, name: "" },
      ]),
    ).toEqual([
      {
        id: "1",
        name: "Player One",
        number: undefined,
        position: undefined,
        country: undefined,
      },
    ]);
  });
});

describe("normalizeFootballLineup", () => {
  it("extracts starting XI for home and away teams", () => {
    const response = [
      {
        team: { id: 100 },
        startXI: [
          { player: { id: 1, name: "Keeper", number: 1, pos: "G" } },
          { player: { id: 2, name: "Defender", number: 4, pos: "D" } },
        ],
        substitutes: [
          { player: { id: 3, name: "Sub One", number: 12, pos: "M" } },
        ],
      },
      {
        team: { id: 200 },
        startXI: [
          { player: { id: 10, name: "Striker", number: 9, pos: "F" } },
        ],
        substitutes: [],
      },
    ];

    const result = normalizeFootballLineup(response, "100", "200");
    expect(result.home).toHaveLength(3);
    expect(result.home[0]).toEqual({
      id: "1",
      name: "Keeper",
      number: "1",
      position: "G",
      starter: true,
    });
    expect(result.home[2]).toEqual(
      expect.objectContaining({ name: "Sub One", starter: false }),
    );
    expect(result.away).toHaveLength(1);
    expect(result.away[0].name).toBe("Striker");
    expect(result.away[0].starter).toBe(true);
  });

  it("returns empty arrays when no lineups match", () => {
    const result = normalizeFootballLineup([], "100", "200");
    expect(result.home).toEqual([]);
    expect(result.away).toEqual([]);
  });
});
