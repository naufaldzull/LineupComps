# LineupComps

LineupComps is a sports matchup intelligence dashboard for basketball and football. It starts from upcoming games, opens a matchup room, compares team metrics, and generates an AI scouting report.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Recharts
- API-SPORTS Football and Basketball APIs
- Gemini API

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Set the keys:

```txt
APISPORTS_KEY=your_api_sports_key
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_key
```

`OPENROUTER_API_KEY` is optional. Without it the scout report runs on Gemini 2.5
Flash only and the other models stay locked in the picker. With it, the OpenRouter
models unlock — including several `:free` ones that cost nothing to run.

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Mock Mode

The dashboard and matchup pages use mock sports data by default through `mock=true` query parameters. This keeps the portfolio demo usable without live API keys.

AI report generation requires `GEMINI_API_KEY` because it calls the server route at `/api/ai/scout-report`.

## Rate Limits and Cost

**API-SPORTS.** The free plan allows a small number of requests per day, and a single
matchup view fans out across several endpoints. Responses are cached through the Next.js
Data Cache in three tiers, defined as `REVALIDATE` in `src/lib/api-sports.ts`:

| Tier | Window | Used for |
| --- | --- | --- |
| `LIVE` | 5 min | Box scores while a game is in progress |
| `SCHEDULE` | 30 min | Daily fixture lists, match events |
| `STATIC` | 6 hours | Lineups, season stats, head-to-head, rosters |

Pass a tier as the fourth argument to `apiSportsGet`. Endpoints default to `SCHEDULE`.

The free tier is also feature-limited, which shapes how fixtures are fetched:

| Parameter | Free tier |
| --- | --- |
| `next`, `last` | Rejected outright |
| `season` | 2022–2024 only |
| `date` | Within one day of today |

So schedules are built from `?date=` across yesterday–tomorrow and filtered by
league id locally, and the calls that need paid parameters are skipped entirely —
spending a request only to discard the error wastes both the daily allowance and
a slot in the 10-per-minute burst cap. Set `APISPORTS_PLAN=paid` to enable them
after upgrading.

**OpenRouter.** `/api/ai/scout-report` is a public route with no authentication, and its
rate limiter is held in memory — which does not survive across serverless instances. Stick
to the `:free` models and set a spending limit on the OpenRouter account. Do not enable the
paid models until that rate limiter is backed by persistent storage.

## Scripts

```bash
npm test
npm run lint
npm run build
npm run dev
```

## Product Scope

MVP includes:

- Football and basketball schedule selector
- Upcoming matchup cards
- Matchup detail page
- Team metric comparison chart
- AI scouting report generation

MVP does not include user accounts, saved reports, betting odds, or player comparison.
