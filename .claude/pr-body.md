## Why

Three problems, all tangled together:

1. **The homepage pulled every fixture on earth.** 272 fixtures across 52 competitions on a single day, including `Capital Territory NPL` and `1. Liga U19`, ranked by keyword weight to pick one "featured" match.
2. **The sidebar was five buttons with no `href`.** It read as unfinished.
3. **Quota was being spent on nothing.** Every endpoint shared one 30-minute revalidate window — including lineups and season stats, which barely move — and several calls could never succeed at all on the free plan.

## What changed

**Caching.** Endpoints are grouped into `LIVE` / `SCHEDULE` / `STATIC` tiers (`src/lib/api-sports.ts`). Stable data drops from 48 refreshes a day to 4. Match events stay on the short window, since goals and substitutions land while a match is in play.

**League registry.** `src/lib/leagues.ts` holds 13 football competitions plus NBA and WNBA. Games now carry `leagueId`, so filtering matches on id rather than name — "Serie A" exists in both Italy and Brazil. NBA is the exception: its dedicated API returns no numeric league id, so those games are still matched by name.

**Schedule pages.** `/schedule` lists competitions per sport; `/schedule/[sport]/[leagueId]` shows one league through the existing `ScheduleList`. The sidebar moved into `AppSidebar` with Home and Fixtures wired up. Analytics, Reports and Alerts stay inert — they have nowhere to go yet.

**Free-plan reality.** Verifying against a live key turned up limits the original design could not have known about:

| Parameter | Free tier |
| --- | --- |
| `next`, `last` | Rejected outright |
| `season` | 2022–2024 only |
| `date` | Within one day of today |

So fixtures are fetched with `?date=` across yesterday–tomorrow and filtered by league locally. Those are the same URLs the homepage requests, so the two share a cache and a league page usually costs nothing extra. Calls needing paid parameters are skipped behind `APISPORTS_PLAN` (defaults to `free`) rather than spent and discarded — they were consuming four slots of the ten-per-minute burst budget per matchup view, which is what made the featured card return 500 on a cold load.

## Bugs found and fixed along the way

- **WNBA was id 116, which is NCAA.** The correct id is 13, filed upstream as "NBA W". The first version of the live check passed it, because it only asked whether an id existed. It now pins each id to the exact name and country the provider reports.
- **`isNbaLeague` matches "NBA W".** A guard meant to drop duplicate NBA fixtures was silently discarding every WNBA game.
- **Extra-time results showed as upcoming.** Football settles a match with `FT`, `AET` or `PEN`; only `FT` was recognised, so three of eighteen "upcoming" fixtures had their final score printed beside them. `isFinishedGame` also decides whether the real box score is fetched, so those matches were shown projected numbers instead of the stats already available. It and `isLiveGame` each kept their own copy of the status list; both now defer to `categorizeGame`.
- **Error messages were misleading.** A `plan` rejection was reported as a quota limit, and the per-minute burst cap as the daily allowance. Raw upstream JSON also reached the response body; it now stays in the server log.

## Verification

Against a live API key:

| | Before | After |
| --- | --- | --- |
| Homepage hot fixtures | 0 of 272 | 26 |
| Upcoming tab | 18, three already decided | 15, all `NS` |
| Finished tab | 8 | 11 |
| Featured card | Projected xG | Real game stats |

League pages return real fixtures: UCL 10, Saudi Pro League 3, WNBA 9. All 15 registry ids resolve to the expected name and country.

`npm test` — 114 passing (from 60). `npm run lint` — 0 errors. `npm run build` — clean.

## Notes for the reviewer

- **`npm run verify:leagues`** is a new opt-in check that validates the registry against the provider in two API calls rather than one per league. It needs `APISPORTS_KEY` in `.env.local` and is deliberately excluded from `npm test`, which stays offline and spends no quota.
- **Tooling was scanning `.worktrees/`**, a stale nested checkout, reporting 372 phantom lint errors and 55 duplicate tests. Now excluded. `vitest.config.ts` is new and also supplies the `@/*` alias, which is why API routes could not be tested before.
- **No Vercel change needed.** `APISPORTS_PLAN` defaults to `free`, which is correct for the current subscription. Set it to `paid` after upgrading and the skipped calls come back.
- **League ids carry a caveat.** They are verified today, but a wrong id fails silently with an empty list rather than an error. `verify:leagues` is the guard against that drifting.
- **`package-lock.json` is intentionally untouched.** It was already modified before this work began.
