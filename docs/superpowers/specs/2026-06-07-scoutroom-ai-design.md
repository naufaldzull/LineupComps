# ScoutRoom AI Design

## Goal

Build a portfolio-ready sports intelligence web app focused on basketball and football. The app should feel like a real product: users start from upcoming match schedules, open a matchup room, compare the two teams, and generate an AI scouting report.

## Stack

- Next.js with TypeScript
- App Router with Route Handlers
- Tailwind CSS
- shadcn/ui for dashboard controls and states
- Recharts for comparison charts
- External sports APIs for basketball and football data
- OpenAI API for AI scouting reports

No database is required for the first version. API keys stay server-side through Next.js route handlers.

## Core Experience

The main flow is:

```txt
Dashboard
-> choose sport: Basketball or Football
-> view upcoming matches
-> select a match
-> open Matchup Room
-> inspect team comparison
-> generate AI scouting report
```

Manual team comparison can be added later, but the MVP should prioritize schedule-driven discovery so the app does not feel like an empty form.

## Pages

### Dashboard

The dashboard shows:

- Sport selector for basketball and football
- Upcoming match list
- Loading, empty, and error states
- Match cards with league, date/time, home team, away team, and status when available

Selecting a match opens the matchup room for that game.

### Matchup Room

The matchup room shows:

- Match header with teams, league, and date/time
- Team comparison summary
- Recent form when available
- Key metrics chart
- Optional head-to-head section if the selected sports API supports it
- AI scouting report panel

## AI Scouting Report

The AI report should summarize the matchup in a non-betting tone. It should focus on:

- Team strengths
- Team weaknesses
- Key matchup factors
- Tactical watch points
- A light game-read summary without gambling language

The AI endpoint receives normalized matchup data, not raw API payloads. This keeps prompts smaller and easier to control.

## Architecture

Proposed structure:

```txt
app/
  page.tsx
  matchup/[sport]/[gameId]/page.tsx
  api/
    sports/
      schedule/route.ts
      matchup/route.ts
    ai/
      scout-report/route.ts
components/
  sport-tabs.tsx
  schedule-list.tsx
  matchup-summary.tsx
  comparison-charts.tsx
  scout-report-panel.tsx
lib/
  sports-api.ts
  openai.ts
  normalizers.ts
```

The browser calls internal Next.js endpoints. Those endpoints call external sports APIs and OpenAI, normalize the data, and return clean JSON to the UI.

## Data Flow

```txt
Browser
-> Next.js Route Handler
-> Sports API or OpenAI API
-> Normalize response
-> Return clean JSON
-> Render dashboard, charts, and report
```

## Data Model

Normalized schedule item:

```ts
type Sport = "basketball" | "football";

type ScheduleGame = {
  id: string;
  sport: Sport;
  league: string;
  startsAt: string;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  status?: string;
};

type TeamSummary = {
  id: string;
  name: string;
  logoUrl?: string;
};
```

Normalized matchup:

```ts
type Matchup = {
  game: ScheduleGame;
  home: TeamProfile;
  away: TeamProfile;
  headToHead?: HeadToHeadSummary;
};

type TeamProfile = TeamSummary & {
  recentForm?: string[];
  metrics: TeamMetric[];
};

type TeamMetric = {
  label: string;
  value: number;
  displayValue?: string;
};

type HeadToHeadSummary = {
  lastMeetings: number;
  homeWins: number;
  awayWins: number;
  notes?: string[];
};
```

## Error Handling

- If API keys are missing, server endpoints return clear setup errors.
- If schedule data is unavailable, the dashboard shows an empty state.
- If matchup stats are incomplete, the UI still renders the available data.
- If AI generation fails, the scouting report panel shows a retry state without breaking the matchup page.

## Testing

Initial test coverage should focus on:

- Normalizing basketball schedule data
- Normalizing football schedule data
- Handling missing API keys in route handlers
- Rendering dashboard empty/loading/error states
- Ensuring AI prompt input uses normalized matchup data

## MVP Scope

The first version includes:

- Basketball and football sport selector
- Upcoming schedule list
- Matchup detail page
- Team comparison summary and chart
- AI scouting report generation

The first version does not include:

- User accounts
- Saved favorite teams
- Historical report storage
- Betting odds or gambling-style predictions
- Full player comparison
