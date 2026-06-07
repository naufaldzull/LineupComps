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
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Mock Mode

The dashboard and matchup pages use mock sports data by default through `mock=true` query parameters. This keeps the portfolio demo usable without live API keys.

AI report generation requires `GEMINI_API_KEY` because it calls the server route at `/api/ai/scout-report`.

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
