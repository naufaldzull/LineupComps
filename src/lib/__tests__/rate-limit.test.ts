import { describe, it, expect, vi, afterEach } from "vitest";
import { RateLimiter } from "../rate-limit";

describe("RateLimiter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows requests under the limit", () => {
    const limiter = new RateLimiter(3, 60_000);
    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const limiter = new RateLimiter(2, 60_000);
    limiter.check("user1");
    limiter.check("user1");
    const result = limiter.check("user1");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const limiter = new RateLimiter(1, 60_000);
    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user2").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(false);
  });

  it("resets after the window expires", () => {
    const limiter = new RateLimiter(1, 1_000);
    const now = Date.now();

    vi.spyOn(Date, "now").mockReturnValue(now);
    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(false);

    vi.spyOn(Date, "now").mockReturnValue(now + 1_001);
    expect(limiter.check("user1").allowed).toBe(true);
  });
});
