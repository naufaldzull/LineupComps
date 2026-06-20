type RequestRecord = {
  count: number;
  resetsAt: number;
};

export class RateLimiter {
  private store = new Map<string, RequestRecord>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(key: string): { allowed: boolean; retryAfterMs: number } {
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
}
