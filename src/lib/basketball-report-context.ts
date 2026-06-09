import { apiSportsGet, isFinishedGame } from "./api-sports";
import {
  normalizeBasketballGame,
  normalizeNbaGame,
} from "./normalizers";
import type {
  BasketballGameEvidence,
  BasketballPlayerEvidence,
  BasketballReportContext,
  Matchup,
  ScheduleGame,
} from "./types";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function numberValue(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? 0));

  return Number.isFinite(parsed) ? parsed : 0;
}

function playerName(value: unknown): string {
  const player = record(value);
  const fullName = String(player.name ?? "").trim();

  if (fullName) {
    return fullName;
  }

  return `${String(player.firstname ?? "").trim()} ${String(
    player.lastname ?? "",
  ).trim()}`.trim();
}

function statLine(statsValue: unknown): string {
  const stats = record(statsValue);
  const reboundValue =
    stats.rebounds && typeof stats.rebounds === "object"
      ? record(stats.rebounds).total
      : stats.rebounds;
  const rebounds = stats.totReb ?? reboundValue;
  const values = [
    `${numberValue(stats.points)} PTS`,
    `${numberValue(rebounds)} REB`,
    `${numberValue(stats.assists)} AST`,
    `${numberValue(stats.steals)} STL`,
    `${numberValue(stats.blocks)} BLK`,
  ];

  return values.join(" · ");
}

export function normalizeNbaPlayerRows(
  value: unknown,
): BasketballPlayerEvidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const row = record(entry);
      const player = record(row.player);
      const team = record(row.team);
      const name = playerName(player);

      if (!name || player.id === undefined || team.id === undefined) {
        return null;
      }

      return {
        id: String(player.id),
        name,
        teamId: String(team.id),
        statLine: statLine(row),
      };
    })
    .filter((item): item is BasketballPlayerEvidence => item !== null);
}

export function normalizeBasketballPlayerGroups(
  value: unknown,
): BasketballPlayerEvidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((groupValue) => {
    const group = record(groupValue);
    const team = record(group.team);
    const directPlayer = record(group.player);

    if (
      directPlayer.id !== undefined &&
      team.id !== undefined &&
      playerName(directPlayer)
    ) {
      return [
        {
          id: String(directPlayer.id),
          name: playerName(directPlayer),
          teamId: String(team.id),
          statLine: statLine(group),
        },
      ];
    }

    const players = Array.isArray(group.players) ? group.players : [];

    return players
      .map((playerValue) => {
        const entry = record(playerValue);
        const player = record(entry.player);
        const statistics = Array.isArray(entry.statistics)
          ? entry.statistics[0]
          : entry.statistics;
        const name = playerName(player);

        if (!name || player.id === undefined || team.id === undefined) {
          return null;
        }

        return {
          id: String(player.id),
          name,
          teamId: String(team.id),
          statLine: statLine(statistics),
        };
      })
      .filter((item): item is BasketballPlayerEvidence => item !== null);
  });
}

export function selectGameEvidence(
  games: ScheduleGame[],
  teamId: string,
  excludedGameId: string,
): BasketballGameEvidence[] {
  return games
    .filter((game) => game.id !== excludedGameId && game.score)
    .filter(
      (game) =>
        game.homeTeam.id === teamId || game.awayTeam.id === teamId,
    )
    .sort(
      (first, second) =>
        new Date(second.startsAt).getTime() - new Date(first.startsAt).getTime(),
    )
    .slice(0, 3)
    .map((game) => {
      const isHome = game.homeTeam.id === teamId;
      const ownScore = isHome ? game.score!.home : game.score!.away;
      const opponentScore = isHome ? game.score!.away : game.score!.home;
      const opponent = isHome ? game.awayTeam.name : game.homeTeam.name;

      return {
        id: game.id,
        opponent,
        result: ownScore === opponentScore ? "D" : ownScore > opponentScore ? "W" : "L",
        score: `${ownScore}-${opponentScore}`,
        startsAt: game.startsAt,
      };
    });
}

function statValue(statLineValue: string, label: string): number {
  const match = statLineValue.match(
    new RegExp(`(?:^|·)\\s*([\\d.]+)\\s+${label}(?:\\s*·|$)`, "i"),
  );

  return match ? numberValue(match[1]) : 0;
}

function playerImpact(player: BasketballPlayerEvidence): number {
  return (
    statValue(player.statLine, "PTS") +
    statValue(player.statLine, "REB") * 0.7 +
    statValue(player.statLine, "AST") * 0.8 +
    statValue(player.statLine, "STL") * 2 +
    statValue(player.statLine, "BLK") * 2
  );
}

export function selectTopPlayerEvidence(
  players: BasketballPlayerEvidence[],
  limit = 6,
): BasketballPlayerEvidence[] {
  const bestByPlayer = new Map<string, BasketballPlayerEvidence>();

  players.forEach((player) => {
    const current = bestByPlayer.get(player.id);

    if (!current || playerImpact(player) > playerImpact(current)) {
      bestByPlayer.set(player.id, player);
    }
  });

  return [...bestByPlayer.values()]
    .sort((first, second) => playerImpact(second) - playerImpact(first))
    .slice(0, limit);
}

function mergeBaselines(
  actual: BasketballPlayerEvidence[],
  baseline: BasketballPlayerEvidence[],
) {
  const baselineById = new Map(
    baseline.map((player) => [player.id, player.statLine]),
  );

  return actual.map((player) => ({
    ...player,
    baseline: baselineById.has(player.id)
      ? `Season baseline: ${baselineById.get(player.id)}`
      : undefined,
  }));
}

function responseArray(value: unknown): unknown[] {
  const response = record(value).response;
  return Array.isArray(response) ? response : [];
}

async function fetchGames(matchup: Matchup, teamId: string) {
  const isNba = matchup.game.id.startsWith("nba:");
  const season = String(new Date(matchup.game.startsAt).getUTCFullYear());
  const data = await apiSportsGet<unknown>(
    isNba ? "nba" : "basketball",
    "/games",
    { team: teamId, season },
  );

  return responseArray(data).map((game) =>
    isNba
      ? normalizeNbaGame(
          game as Parameters<typeof normalizeNbaGame>[0],
        )
      : normalizeBasketballGame(
          game as Parameters<typeof normalizeBasketballGame>[0],
        ),
  );
}

async function fetchPlayers(
  matchup: Matchup,
  teamId: string,
  gameOnly: boolean,
) {
  const isNba = matchup.game.id.startsWith("nba:");
  const season = String(new Date(matchup.game.startsAt).getUTCFullYear());
  const params: Record<string, string> = gameOnly
    ? { game: matchup.game.id.replace("nba:", "") }
    : { team: teamId, season };
  const path =
    isNba || !gameOnly ? "/players/statistics" : "/games/statistics/players";
  const data = await apiSportsGet<unknown>(
    isNba ? "nba" : "basketball",
    path,
    gameOnly && !isNba ? { id: matchup.game.id } : params,
  );
  const rows = responseArray(data);

  return isNba
    ? normalizeNbaPlayerRows(rows).filter((player) => player.teamId === teamId)
    : normalizeBasketballPlayerGroups(rows).filter(
        (player) => player.teamId === teamId,
      );
}

async function safely<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch {
    return fallback;
  }
}

export async function buildBasketballReportContext(
  matchup: Matchup,
): Promise<BasketballReportContext> {
  const mode = isFinishedGame(matchup.game) ? "post-game" : "pre-game";
  const [homeGames, awayGames] = await Promise.all([
    safely(() => fetchGames(matchup, matchup.home.id), []),
    safely(() => fetchGames(matchup, matchup.away.id), []),
  ]);
  const combinedGames = [...homeGames, ...awayGames].filter(
    (game, index, all) => all.findIndex((item) => item.id === game.id) === index,
  );
  const headToHeadGames = combinedGames.filter((game) => {
    const ids = [game.homeTeam.id, game.awayTeam.id];
    return ids.includes(matchup.home.id) && ids.includes(matchup.away.id);
  });
  const [homePlayers, awayPlayers] = await Promise.all([
    safely(() => fetchPlayers(matchup, matchup.home.id, mode === "post-game"), []),
    safely(() => fetchPlayers(matchup, matchup.away.id, mode === "post-game"), []),
  ]);
  let finalHomePlayers = homePlayers;
  let finalAwayPlayers = awayPlayers;

  if (mode === "post-game" && (homePlayers.length || awayPlayers.length)) {
    const [homeBaseline, awayBaseline] = await Promise.all([
      safely(() => fetchPlayers(matchup, matchup.home.id, false), []),
      safely(() => fetchPlayers(matchup, matchup.away.id, false), []),
    ]);
    finalHomePlayers = mergeBaselines(homePlayers, homeBaseline);
    finalAwayPlayers = mergeBaselines(awayPlayers, awayBaseline);
  }

  return {
    mode,
    home: {
      id: matchup.home.id,
      name: matchup.home.name,
      recentGames: selectGameEvidence(
        homeGames,
        matchup.home.id,
        matchup.game.id,
      ),
      headToHead: selectGameEvidence(
        headToHeadGames,
        matchup.home.id,
        matchup.game.id,
      ),
      players: selectTopPlayerEvidence(finalHomePlayers),
    },
    away: {
      id: matchup.away.id,
      name: matchup.away.name,
      recentGames: selectGameEvidence(
        awayGames,
        matchup.away.id,
        matchup.game.id,
      ),
      headToHead: selectGameEvidence(
        headToHeadGames,
        matchup.away.id,
        matchup.game.id,
      ),
      players: selectTopPlayerEvidence(finalAwayPlayers),
    },
  };
}
