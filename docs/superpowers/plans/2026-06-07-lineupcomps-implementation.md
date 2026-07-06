# LineupComps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build LineupComps, a portfolio-ready basketball and football matchup comparison app with schedule-driven entry and AI scouting reports.

**Architecture:** Use Next.js App Router as a small fullstack app. Browser pages call internal route handlers, route handlers call API-SPORTS and Gemini, and shared normalizers convert football/basketball payloads into stable UI models.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, Recharts, API-SPORTS Football/Basketball APIs, Gemini API.

---

## File Structure

- `package.json`: scripts and dependencies.
- `.env.example`: required env variables.
- `src/app/layout.tsx`: app shell and metadata.
- `src/app/page.tsx`: dashboard with sport tabs and upcoming schedule.
- `src/app/matchup/[sport]/[gameId]/page.tsx`: matchup detail route.
- `src/app/api/sports/schedule/route.ts`: schedule API route.
- `src/app/api/sports/matchup/route.ts`: matchup API route.
- `src/app/api/ai/scout-report/route.ts`: AI report API route.
- `src/components/*`: focused UI components for sport selection, schedule, matchup, charts, and report.
- `src/lib/types.ts`: shared normalized types.
- `src/lib/env.ts`: required environment variable helpers.
- `src/lib/api-sports.ts`: API-SPORTS client.
- `src/lib/normalizers.ts`: basketball and football data mapping.
- `src/lib/mock-data.ts`: fallback development data.
- `src/lib/gemini.ts`: Gemini report generation.
- `src/lib/__tests__/*.test.ts`: unit tests for env and normalizers.

## Task 1: Scaffold Next.js App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `.env.example`

- [ ] **Step 1: Create the app configuration files**

Create `package.json`:

```json
{
  "name": "lineupcomps",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "@radix-ui/react-tabs": "^1.1.13",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.0",
    "tailwind-merge": "^2.5.5",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.0.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.0",
    "vitest": "^2.1.8"
  }
}
```

Create `.env.example`:

```txt
APISPORTS_KEY=
GEMINI_API_KEY=
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 3: Add app shell**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LineupComps",
  description: "AI-assisted sports matchup comparison for basketball and football."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Commit scaffold**

Run:

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs tailwind.config.ts src/app/globals.css src/app/layout.tsx .env.example
git commit -m "feat: scaffold LineupComps app"
```

## Task 2: Add Shared Types, Env Helpers, and Normalizers

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/normalizers.ts`
- Create: `src/lib/__tests__/normalizers.test.ts`
- Create: `src/lib/__tests__/env.test.ts`

- [ ] **Step 1: Write normalizer tests**

Create `src/lib/__tests__/normalizers.test.ts` with tests that assert football fixture and basketball game payloads map to `ScheduleGame` with `id`, `sport`, `league`, `startsAt`, `homeTeam`, `awayTeam`, and `status`.

- [ ] **Step 2: Add types and implementation**

Create `src/lib/types.ts`:

```ts
export type Sport = "basketball" | "football";

export type TeamSummary = {
  id: string;
  name: string;
  logoUrl?: string;
};

export type ScheduleGame = {
  id: string;
  sport: Sport;
  league: string;
  startsAt: string;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  status?: string;
  score?: { home: number; away: number };
};

export type TeamMetric = {
  label: string;
  value: number;
  displayValue?: string;
};

export type TeamProfile = TeamSummary & {
  recentForm?: string[];
  metrics: TeamMetric[];
};

export type Matchup = {
  game: ScheduleGame;
  home: TeamProfile;
  away: TeamProfile;
};
```

Create `src/lib/env.ts`:

```ts
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}
```

Create `src/lib/normalizers.ts` with `normalizeFootballFixture`, `normalizeBasketballGame`, and `normalizeMetricValue` using the shared types. Both normalizers must map `score` from the API response when status is `"FT"` or `"LIVE"`.

- [ ] **Step 3: Run tests**

Run:

```bash
npm test -- src/lib/__tests__/normalizers.test.ts src/lib/__tests__/env.test.ts
```

Expected: tests pass.

- [ ] **Step 4: Commit domain layer**

Run:

```bash
git add src/lib
git commit -m "feat: add sports domain normalizers"
```

## Task 3: Build API-SPORTS Client and Sports Routes

**Files:**
- Create: `src/lib/api-sports.ts`
- Create: `src/lib/mock-data.ts`
- Create: `src/app/api/sports/schedule/route.ts`
- Create: `src/app/api/sports/matchup/route.ts`

- [ ] **Step 1: Implement API client**

Create `src/lib/api-sports.ts` with:

```ts
import { requireEnv } from "./env";
import type { Sport } from "./types";

const BASE_URLS: Record<Sport, string> = {
  football: "https://v3.football.api-sports.io",
  basketball: "https://v1.basketball.api-sports.io"
};

export async function apiSportsGet<T>(
  sport: Sport,
  path: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${BASE_URLS[sport]}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: { "x-apisports-key": requireEnv("APISPORTS_KEY") },
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error(`API-SPORTS request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 2: Implement schedule route**

Create `src/app/api/sports/schedule/route.ts` to accept `sport`, `date`, and optional `mock=true`. Use mock data when `mock=true`, otherwise call `/fixtures` for football and `/games` for basketball. After normalizing, filter out games where `status === "FT"` and `startsAt` is more than 3 hours in the past — use `Date.now()` compared to `new Date(game.startsAt).getTime() + 3 * 60 * 60 * 1000`.

- [ ] **Step 3: Implement matchup route**

Create `src/app/api/sports/matchup/route.ts` to accept `sport`, `gameId`, and optional `mock=true`. Return a normalized `Matchup` with available metrics, using mock fallback for local demos.

- [ ] **Step 4: Commit routes**

Run:

```bash
git add src/lib/api-sports.ts src/lib/mock-data.ts src/app/api/sports
git commit -m "feat: add sports API routes"
```

## Task 4: Build Dashboard UI

**Files:**
- Create: `src/components/sport-tabs.tsx`
- Create: `src/components/schedule-list.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create sport tabs**

Create `src/components/sport-tabs.tsx` as a client component that switches between `basketball` and `football` with accessible buttons.

- [ ] **Step 2: Create schedule list**

Create `src/components/schedule-list.tsx` as a client component that fetches `/api/sports/schedule?sport=<sport>&mock=true`, renders loading, empty, error, and match cards, and links each card to `/matchup/<sport>/<gameId>?mock=true`.

- [ ] **Step 3: Create dashboard page**

Create `src/app/page.tsx` with a focused dashboard layout: brand header, sport selector, upcoming matches, and compact portfolio-quality styling.

- [ ] **Step 4: Commit dashboard**

Run:

```bash
git add src/app/page.tsx src/components/sport-tabs.tsx src/components/schedule-list.tsx
git commit -m "feat: add schedule dashboard"
```

## Task 5: Build Matchup Room

**Files:**
- Create: `src/components/matchup-summary.tsx`
- Create: `src/components/comparison-charts.tsx`
- Create: `src/components/scout-report-panel.tsx`
- Create: `src/app/matchup/[sport]/[gameId]/page.tsx`

- [ ] **Step 1: Create matchup components**

Create summary, chart, and report panel components. `comparison-charts.tsx` should use Recharts to compare team metrics side-by-side.

- [ ] **Step 2: Create matchup page**

Create `src/app/matchup/[sport]/[gameId]/page.tsx` to fetch `/api/sports/matchup?sport=<sport>&gameId=<gameId>&mock=true`, render matchup data, and pass it to the AI report panel.

- [ ] **Step 3: Commit matchup room**

Run:

```bash
git add src/app/matchup src/components/matchup-summary.tsx src/components/comparison-charts.tsx src/components/scout-report-panel.tsx
git commit -m "feat: add matchup room"
```

## Task 6: Add Gemini Scouting Report

**Files:**
- Create: `src/lib/gemini.ts`
- Create: `src/app/api/ai/scout-report/route.ts`
- Modify: `src/components/scout-report-panel.tsx`

- [ ] **Step 1: Implement Gemini helper**

Create `src/lib/gemini.ts` to call Gemini with normalized matchup JSON and request a structured non-betting scouting report.

- [ ] **Step 2: Implement AI route**

Create `src/app/api/ai/scout-report/route.ts` that accepts a `Matchup`, validates the body, calls `generateScoutReport`, and returns `{ report: string }`.

- [ ] **Step 3: Wire report panel**

Modify `src/components/scout-report-panel.tsx` so the user can click a button, generate the report, see loading state, retry after failure, and read the report.

- [ ] **Step 4: Commit AI feature**

Run:

```bash
git add src/lib/gemini.ts src/app/api/ai/scout-report/route.ts src/components/scout-report-panel.tsx
git commit -m "feat: add AI scouting reports"
```

## Task 7: Final Verification and Polish

**Files:**
- Modify: `src/app/globals.css`
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Add README**

Create `README.md` with setup steps, env vars, mock mode explanation, and how to run the app.

- [ ] **Step 2: Run verification**

Run:

```bash
npm test
npm run build
```

Expected: tests pass and production build completes.

- [ ] **Step 3: Start dev server**

Run:

```bash
npm run dev
```

Expected: app is available at `http://localhost:3000`.

- [ ] **Step 4: Browser QA**

Open `http://localhost:3000`, confirm dashboard renders, switch sports, open one matchup, generate mock/report states, and verify mobile width does not overlap text.

- [ ] **Step 5: Commit polish**

Run:

```bash
git add README.md src/app/globals.css .env.example
git commit -m "docs: add LineupComps setup guide"
```

## Self-Review

- Spec coverage: Dashboard, schedule entry, basketball/football selector, matchup room, comparison chart, AI report, no database, and non-betting tone are covered.
- Placeholder scan: No red-flag placeholder items remain.
- Type consistency: `Sport`, `ScheduleGame`, `TeamSummary`, `TeamProfile`, `TeamMetric`, and `Matchup` names match the design spec.
- Scope check: User accounts, saved favorites, player comparison, betting odds, and historical report storage stay out of MVP.
