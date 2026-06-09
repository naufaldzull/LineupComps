# Basketball Final Box Score Design

## Goal

For completed basketball games, show the real statistics from that specific
game instead of projected or season-average team metrics.

## Data Flow

- Treat `FT`, `Finished`, `Game Finished`, and equivalent completed statuses as
  final games.
- API-Basketball final games fetch `/games/statistics/teams?id=<gameId>`.
- API-NBA final games fetch `/games/statistics?id=<gameId>`.
- Normalize both providers to `PTS`, `AST`, `REB`, `FT%`, `FG%`, `3FG%`,
  `STL`, and `BLK`.
- Use the game score for `PTS` when API-Basketball's team-statistics payload
  does not include points.
- Switch to game statistics only when both teams have complete provider rows.
  Otherwise preserve the existing season/projected fallback.

## UI

The comparison panel labels completed box scores as `Final Game Stats`. Fallback
data remains clearly labeled as `Season Averages` or `Projected Comparison`.

## Testing

Unit tests cover completed-status detection and both provider normalizers.
Existing lint, unit tests, and production build must remain green.
