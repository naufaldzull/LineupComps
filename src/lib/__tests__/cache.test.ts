import { describe, it, expect, vi, afterEach } from "vitest";
import { TTLCache } from "../cache";

describe("TTLCache", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns undefined for missing keys", () => {
    const cache = new TTLCache<string>();
    expect(cache.get("missing")).toBeUndefined();
  });

  it("stores and retrieves a value", () => {
    const cache = new TTLCache<string>();
    cache.set("key", "value", 60_000);
    expect(cache.get("key")).toBe("value");
  });

  it("returns undefined after TTL expires", () => {
    const cache = new TTLCache<string>();
    const now = Date.now();

    vi.spyOn(Date, "now").mockReturnValue(now);
    cache.set("key", "value", 1_000);

    vi.spyOn(Date, "now").mockReturnValue(now + 1_001);
    expect(cache.get("key")).toBeUndefined();
  });

  it("removes expired entries from the store", () => {
    const cache = new TTLCache<string>();
    const now = Date.now();

    vi.spyOn(Date, "now").mockReturnValue(now);
    cache.set("key", "value", 1_000);
    expect(cache.size).toBe(1);

    vi.spyOn(Date, "now").mockReturnValue(now + 1_001);
    cache.get("key");
    expect(cache.size).toBe(0);
  });

  it("overwrites existing entries", () => {
    const cache = new TTLCache<string>();
    cache.set("key", "first", 60_000);
    cache.set("key", "second", 60_000);
    expect(cache.get("key")).toBe("second");
    expect(cache.size).toBe(1);
  });
});
