# Basketball Final Box Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace basketball averages with real game box scores when a fixture is finished.

**Architecture:** Provider-specific payloads are normalized in `api-sports.ts` into the existing `TeamMetric[]` contract. The matchup route conditionally fetches final-game statistics and records their source for the comparison UI.

**Tech Stack:** Next.js, TypeScript, Vitest, API-SPORTS Basketball, API-NBA.

---

### Task 1: Normalize Final Game Statistics

**Files:**
- Modify: `src/lib/api-sports.ts`
- Test: `src/lib/__tests__/api-sports.test.ts`

- [x] Add failing tests for finished-status detection and both provider payloads.
- [x] Run `npm.cmd test -- src/lib/__tests__/api-sports.test.ts --run`.
- [x] Add the minimum normalizers required to produce the eight basketball metrics.
- [x] Re-run the focused tests and confirm they pass.

### Task 2: Select Box Scores in the Matchup Route

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/app/api/sports/matchup/route.ts`

- [x] Add a normalized metric-source field to `Matchup`.
- [x] Fetch provider game statistics only for completed basketball games.
- [x] Replace both team metric arrays only when both provider rows are present.
- [x] Preserve current season/projected metrics when box scores are unavailable.

### Task 3: Label the Comparison Correctly

**Files:**
- Modify: `src/components/comparison-charts.tsx`

- [x] Render `Final Game Stats`, `Season Averages`, or `Projected Comparison`
  from the normalized metric source.
- [x] Run lint, the complete test suite, and the production build.
