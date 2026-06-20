# Caching Layer — Scout Report Cache

## Problem

The `/api/ai/scout-report` POST endpoint calls Gemini AI on every request. The same matchup generates the same report, so repeated views waste API quota and add latency (~3-5s per Gemini call).

API-SPORTS calls already use `next: { revalidate: 300 }` which leverages Next.js Data Cache on Vercel — no changes needed there.

## Solution

In-memory TTL cache at the module level for scout report responses.

### Cache Utility (`src/lib/cache.ts`)

Generic `TTLCache<T>` class:
- Backed by a `Map<string, { value: T; expiresAt: number }>`
- `get(key)` returns value if not expired, else deletes and returns `undefined`
- `set(key, value, ttlMs)` stores with expiration timestamp
- Lazy eviction (on `get`) — no background timers needed

### Integration

In `scout-report/route.ts`:
- Cache key: `{sport}:{gameId}`
- TTL for finished games: 60 minutes (result won't change)
- TTL for live/upcoming games: 10 minutes (data may update)
- Check cache before calling `generateScoutReport`
- Store result after successful generation

### What This Does NOT Do

- No persistent cache (Redis, KV) — overkill for portfolio scope
- No cache for API-SPORTS calls — already handled by Next.js fetch cache
- No cache headers on responses — client-side caching is separate concern

## Files Changed

1. `src/lib/cache.ts` — new TTLCache utility
2. `src/lib/__tests__/cache.test.ts` — unit tests
3. `src/app/api/ai/scout-report/route.ts` — integrate cache
