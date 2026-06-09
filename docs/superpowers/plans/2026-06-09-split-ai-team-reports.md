# Split AI Team Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build separate, evidence-based pre-game and post-game AI reports for each basketball team.

**Architecture:** The existing AI route enriches a normalized matchup on demand with recent games, head-to-head games, and player statistics. Gemini returns a validated structured report consumed by a split-column React presentation.

**Tech Stack:** Next.js, TypeScript, API-SPORTS, Gemini, Vitest, Tailwind CSS.

---

### Task 1: Report Contracts And Prompt

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/gemini.ts`
- Test: `src/lib/__tests__/gemini.test.ts`

- [x] Add failing tests for separate home/away JSON reports and player-name constraints.
- [x] Add normalized report-context and structured report types.
- [x] Build mode-specific Gemini prompts and validate parsed JSON output.

### Task 2: On-demand Basketball Enrichment

**Files:**
- Create: `src/lib/basketball-report-context.ts`
- Modify: `src/app/api/ai/scout-report/route.ts`
- Test: `src/lib/__tests__/basketball-report-context.test.ts`

- [x] Add failing tests for recent-game, head-to-head, and player normalization.
- [x] Fetch enrichment only inside the report POST route.
- [x] Preserve partial context when a provider endpoint fails.

### Task 3: Split Report Presentation

**Files:**
- Modify: `src/components/scout-report-panel.tsx`

- [x] Replace markdown parsing with structured home and away report columns.
- [x] Hide empty player and history sections.
- [x] Stack columns responsively on mobile.

### Task 4: Verification

- [x] Run focused tests during each red-green cycle.
- [x] Run `npm.cmd run lint`.
- [x] Run `npm.cmd test -- --run`.
- [x] Run `npm.cmd run build`.
