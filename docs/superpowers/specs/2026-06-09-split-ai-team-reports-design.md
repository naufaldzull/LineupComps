# Split AI Team Reports Design

## Goal

Generate separate home and away basketball reports with different pre-game and
post-game analysis, using only player and game facts returned by API-SPORTS.

## Trigger And Data Budget

Additional history and player requests run only after the user selects
`Generate Report`. Opening the matchup page does not spend these requests.

## Pre-game Report

Each team column contains:

- Strengths and weaknesses
- Review of its three most recent games
- Review of up to three recent head-to-head games
- Players projected to shine
- Players who may struggle
- A compact team outlook

Player projections are omitted when the provider does not return enough player
statistics.

## Post-game Report

Each team column contains:

- Strengths and weaknesses from the completed game
- Players who shined
- Players who performed poorly, only when supported by the box score
- Expected players who underperformed
- Unexpected players who exceeded their recent or season baseline
- A compact team verdict

Expectation sections require both actual game stats and a comparison baseline.
They are omitted when either side of that comparison is unavailable.

## Data Integrity

Gemini receives normalized JSON, never raw provider payloads. It may only name
players included in that JSON. Empty or unsupported sections return empty
arrays and are hidden by the UI.

## Output And UI

Gemini returns validated structured JSON with `home` and `away` team reports.
Desktop uses two equal report columns. Mobile stacks home before away. Player
cards may contain multiple players and use real stat lines as evidence.

## Failure Handling

Provider enrichment uses partial fallback. Team-level reporting still works
when player or history endpoints fail. A Gemini or validation failure keeps the
existing retry state and does not break the matchup page.
