import { afterEach, describe, expect, it } from "vitest";

import { requireEnv } from "../env";

describe("requireEnv", () => {
  const originalValue = process.env.LINEUPCOMPS_TEST_KEY;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.LINEUPCOMPS_TEST_KEY;
    } else {
      process.env.LINEUPCOMPS_TEST_KEY = originalValue;
    }
  });

  it("returns the configured environment value", () => {
    process.env.LINEUPCOMPS_TEST_KEY = "secret-value";

    expect(requireEnv("LINEUPCOMPS_TEST_KEY")).toBe("secret-value");
  });

  it("throws when the environment value is missing", () => {
    delete process.env.LINEUPCOMPS_TEST_KEY;

    expect(() => requireEnv("LINEUPCOMPS_TEST_KEY")).toThrow(
      "LINEUPCOMPS_TEST_KEY is required",
    );
  });

  it("throws when the environment value is empty", () => {
    process.env.LINEUPCOMPS_TEST_KEY = "";

    expect(() => requireEnv("LINEUPCOMPS_TEST_KEY")).toThrow(
      "LINEUPCOMPS_TEST_KEY is required",
    );
  });
});
