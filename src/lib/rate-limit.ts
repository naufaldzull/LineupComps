import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RequestRecord = {
  count: number;
  resetsAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
};

export class RateLimiter {
  private store = new Map<string, RequestRecord>();
  private maxRequests: number;
  private windowMs: number;
  private upstashLimiter: Ratelimit | null = null;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    const url =
      process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (url && token) {
      try {
        const redis = new Redis({ url, token });
        const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
        this.upstashLimiter = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
          analytics: false,
          prefix: "lineupcomps:ratelimit",
        });
      } catch (error) {
        console.warn(
          "Failed to initialize Upstash Redis rate limiter, using in-memory fallback:",
          error,
        );
      }
    }
  }

  private checkMemory(key: string): RateLimitResult {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetsAt) {
      this.store.set(key, { count: 1, resetsAt: now + this.windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }

    if (record.count >= this.maxRequests) {
      return { allowed: false, retryAfterMs: record.resetsAt - now };
    }

    record.count++;
    return { allowed: true, retryAfterMs: 0 };
  }

  async check(key: string): Promise<RateLimitResult> {
    if (this.upstashLimiter) {
      try {
        const { success, reset } = await this.upstashLimiter.limit(key);
        return {
          allowed: success,
          retryAfterMs: success ? 0 : Math.max(0, reset - Date.now()),
        };
      } catch (error) {
        console.error(
          "Upstash limit check failed, falling back to memory:",
          error,
        );
      }
    }

    return this.checkMemory(key);
  }
}
