import { describe, expect, it } from "vitest";

describe("app metadata", () => {
  it("uses the LineupComps product metadata in the root layout", async () => {
    const layoutSource = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../layout.tsx", import.meta.url), "utf8"),
    );

    expect(layoutSource).toContain('title: "LineupComps"');
    expect(layoutSource).toContain(
      '"AI-assisted sports matchup comparison for basketball and football."',
    );
  });
});
