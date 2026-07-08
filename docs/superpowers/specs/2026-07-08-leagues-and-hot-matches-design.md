# Leagues Schedule Page + Hot-Match Homepage — Design

**Date:** 2026-07-08
**Status:** Approved (pending spec review)

## Problem

Two related gaps:

1. **Homepage is noisy.** The dashboard fetches *every* fixture worldwide for today's
   date and ranks one "featured" game by keyword weight. Obscure leagues leak into the
   featured slot and the schedule list. The user wants the homepage to surface only
   genuinely hot competitions (World Cup + top leagues; NBA + WNBA).

2. **No schedule browsing.** The sidebar calendar icon is a dead button. There is no way
   to browse leagues or see a specific league's fixtures.

## Goals

- Curated league registry as the single source of truth for "allowed" competitions.
- Homepage featured game and schedule list restricted to registry leagues.
- A `/schedule` page: browse leagues (by sport) → drill into one league's fixtures.
- Wire the sidebar: Home → `/`, calendar → `/schedule`.

## Non-Goals

- Analytics / Reports / Alerts pages (sidebar items stay inert).
- Dark mode, global search.
- User-configurable league lists (registry is code-defined).

## League Registry

New module `src/lib/leagues.ts`. Each entry:

```ts
type LeagueDef = {
  id: string;            // API-SPORTS league id (string form); "nba" sentinel for NBA
  name: string;          // display name
  sport: Sport;          // "football" | "basketball"
  apiSport: SportsApi;   // "football" | "basketball" | "nba" — which API to call
  country: string;       // display, e.g. "England", "International", "USA"
  logoUrl?: string;      // optional crest/logo
};
```

**Football (13)** — API-SPORTS football league ids (provisional; see Verification):

| League | id | country |
|---|---|---|
| FIFA World Cup | 1 | International |
| UEFA Champions League | 2 | Europe |
| UEFA Europa League | 3 | Europe |
| Premier League | 39 | England |
| La Liga | 140 | Spain |
| Serie A | 135 | Italy |
| Bundesliga | 78 | Germany |
| Ligue 1 | 61 | France |
| Primeira Liga | 94 | Portugal |
| Eredivisie | 88 | Netherlands |
| MLS | 253 | USA |
| Saudi Pro League | 307 | Saudi Arabia |
| Brasileirão Série A | 71 | Brazil |

**Basketball (2):**

| League | id | apiSport | country |
|---|---|---|---|
| NBA | `nba` | nba | USA |
| WNBA | 116 | basketball | USA |

Helpers:
- `getLeaguesForSport(sport): LeagueDef[]`
- `getLeagueById(sport, id): LeagueDef | undefined`
- `HOT_FOOTBALL_LEAGUE_IDS`, `HOT_BASKETBALL_LEAGUE_IDS` (Sets, for fast filtering)
- `isHotLeague(game): boolean` — true if `game.leagueId` is in the sport's hot set, OR
  (fallback) the game is an NBA game (NBA games have no numeric league id).

## Track `leagueId` on games

Currently `ScheduleGame.league` is only the display name; the API's `league.id` is
dropped in normalizers. Names are not unique (e.g. "Serie A" exists in Italy *and*
Brazil), so filtering by name is unsafe.

Change:
- Add optional `leagueId?: string` to `ScheduleGame` (`src/lib/types.ts`).
- `normalizeFootballFixture` / `normalizeBasketballGame` set `leagueId: String(raw.league.id)`.
- `normalizeNbaGame` leaves `leagueId` undefined (NBA identified via the `nba:` id prefix
  and the "NBA" league name, already handled by `isHotLeague`).

## Homepage: hot-match only

- **Schedule API** (`/api/sports/schedule`): accept `hot=true`. When set, filter the
  normalized games to `isHotLeague(game)` before returning. One upstream call as today
  (football: `/fixtures?date=`; basketball: NBA + basketball combined), just filtered.
- **Dashboard** calls `/api/sports/schedule?sport=<s>&hot=true&mock=<m>`.
- `selectFeaturedGame` and the schedule list therefore only ever see hot leagues. The
  existing keyword weighting in `scoreGame` still ranks within the hot set (kept as-is —
  it now operates on an already-clean list).
- **Empty state:** when the hot-filtered list is empty (off day), the featured area shows
  a "No hot matches today" card with a link to `/schedule`. (Mock mode is unaffected —
  mock schedules are curated already.)

## Schedule pages

**`/schedule` (`src/app/schedule/page.tsx`)** — client component:
- Uses the shared sidebar and the existing `SportTabs` to toggle football/basketball.
- Renders a responsive grid of **league cards** from `getLeaguesForSport(sport)`
  (logo, name, country). Each card is a `next/link` to `/schedule/<sport>/<id>`.

**`/schedule/[sport]/[leagueId]` (league detail)** — client component:
- Reads params, looks up the `LeagueDef` (404 UI if unknown).
- Fetches `/api/sports/league-schedule?sport=<s>&leagueId=<id>` and renders the existing
  `ScheduleList` (which already groups live/upcoming/finished and links each game to the
  matchup page). Header shows league name + logo + a back link to `/schedule`.

**`/api/sports/league-schedule` (new route):**
- Params: `sport`, `leagueId`. Validates against the registry.
- Football: `/fixtures?league=<id>&next=15` + `/fixtures?league=<id>&last=5`, merged and
  de-duped; normalized via `normalizeFootballFixture`. (`next`/`last` avoid season-param
  complexity across calendar-year vs split-year leagues.)
- WNBA (basketball): `/games?league=116&season=<year>` normalized via
  `normalizeBasketballGame`, then keep upcoming + recent.
- NBA: `/games?season=<year>` (dedicated NBA API) via `normalizeNbaGame`, keep upcoming +
  recent, cap to ~20.
- Returns `{ games }`, mirroring the schedule route shape. In mock mode (`mock=true`) it
  returns `getMockSchedule(sport)` unfiltered — enough to render the page without a key.

## Shared sidebar

The sidebar currently lives inline in `DashboardPage`. Extract to
`src/components/app-sidebar.tsx` as `<AppSidebar active="home" | "schedule" />`:
- Nav items become `next/link`s where wired: Home → `/`, calendar (Fixtures) → `/schedule`.
- Analytics/Reports/Alerts render as before but inert (no href).
- `DashboardPage` and both schedule pages render `<AppSidebar>` so nav is consistent.

## Data Flow

```
Homepage (/)                      Schedule (/schedule)         League detail
  DashboardPage                     SchedulePage                 LeagueSchedulePage
    -> /api/sports/schedule           -> getLeaguesForSport()      -> /api/sports/league-schedule
       ?hot=true                         (static registry)            ?sport&leagueId
    -> isHotLeague filter             -> league cards -> link      -> next15 + last5, normalized
    -> selectFeaturedGame                                          -> ScheduleList
    -> ScheduleList (hot only)
```

## Error Handling

- League-schedule route: upstream failure → 500 `{ error }`, page shows an error card
  (same pattern as dashboard). Partial NBA/basketball failure tolerated via allSettled.
- Unknown `leagueId` or sport → route returns 400; detail page shows "League not found".
- Empty results → "No fixtures scheduled" state (not an error).

## Testing

- `leagues.ts`: `getLeaguesForSport`, `getLeagueById`, `isHotLeague` (hot/cold/NBA cases).
- `schedule` route: `hot=true` filters out non-registry games; `hot` unset unchanged.
- `league-schedule` route: builds correct upstream params per apiSport; merges next+last;
  de-dupes; validates unknown league → 400. (fetch mocked, mirroring existing route tests.)
- Normalizers: `leagueId` populated for football/basketball, undefined for NBA.

## Verification (deployment)

League ids above are the standard API-SPORTS documented ids but cannot be verified in this
repo (no API key locally; only `.env.example`). During implementation, add a short note /
the owner should confirm on the deployed instance that each id returns fixtures — a wrong
id fails silently (empty list). WNBA (116) and Saudi Pro League (307) are the least certain.
