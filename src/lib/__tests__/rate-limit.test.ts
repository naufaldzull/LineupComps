import { describe, it, expect, vi, afterEach } from "vitest";
import { RateLimiter } from "../rate-limit";

describe("RateLimiter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows requests under the limit", async () => {
    const limiter = new RateLimiter(3, 60_000);
    expect((await limiter.check("user1")).allowed).toBe(true);
    expect((await limiter.check("user1")).allowed).toBe(true);
    expect((await limiter.check("user1")).allowed).toBe(true);
  });

  it("blocks requests over the limit", async () => {
    const limiter = new RateLimiter(2, 60_000);
    await limiter.check("user1");
    await limiter.check("user1");
    const result = await limiter.check("user1");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks keys independently", async () => {
    const limiter = new RateLimiter(1, 60_000);
    expect((await limiter.check("user1")).allowed).toBe(true);
    expect((await limiter.check("user2")).allowed).toBe(true);
    expect((await limiter.check("user1")).allowed).toBe(false);
  });

  it("resets after the window expires", async () => {
    const limiter = new RateLimiter(1, 1_000);
    const now = Date.now();

    vi.spyOn(Date, "now").mockReturnValue(now);
    expect((await limiter.check("user1")).allowed).toBe(true);
    expect((await limiter.check("user1")).allowed).toBe(false);

    vi.spyOn(Date, "now").mockReturnValue(now + 1_001);
    expect((await limiter.check("user1")).allowed).toBe(true);
  });
});
