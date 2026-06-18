import { describe, expect, it } from "vitest";

import { normalizeBasketballRoster } from "../player-roster";

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
