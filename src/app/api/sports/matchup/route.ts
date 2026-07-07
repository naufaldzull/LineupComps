import { NextResponse } from "next/server";

import {
  apiSportsGet,
  buildBasketballGameMetrics,
  buildFootballGameMetrics,
  buildMatchupMetrics,
  buildNbaGameMetrics,
  buildNbaTeamMetrics,
  buildRecentFormFromGames,
  isFinishedGame,
  isLiveGame,
  type BasketballGameStatistics,
  type FootballFixtureStatistics,
  type NbaGameStatistics,
  type NbaTeamStatistics,
} from "@/lib/api-sports";
import { getMockMatchup } from "@/lib/mock-data";
import {
  normalizeBasketballGame,
  normalizeFootballFixture,
  normalizeNbaGame,
} from "@/lib/normalizers";
import type { Matchup, ScheduleGame, Sport } from "@/lib/types";

type FootballFixturesResponse = {
  response: Parameters<typeof normalizeFootballFixture>[0][];
};

type BasketballGamesResponse = {
  response: Parameters<typeof normalizeBasketballGame>[0][];
};

type NbaGamesResponse = {
  response: Parameters<typeof normalizeNbaGame>[0][];
};

type NbaTeamStatisticsResponse = {
  response: NbaTeamStatistics[];
};

type BasketballGameStatisticsResponse = {
  response: BasketballGameStatistics[];
};

type FootballStatisticsResponse = {
  response: FootballFixtureStatistics[];
};

type NbaGameStatisticsResponse = {
  response: NbaGameStatistics[];
};

function parseSport(value: string | null): Sport | null {
  return value === "basketball" || value === "football" ? value : null;
}

async function fetchRecentTeamGames(
  sport: Sport,
  isNbaGame: boolean,
  teamId: string,
  gameStartsAt: string,
): Promise<ScheduleGame[]> {
  try {
    if (sport === "football") {
      const data = await apiSportsGet<FootballFixturesResponse>(
        "football",
        "/fixtures",
        { team: teamId, last: "10" },
      );
      return data.response.map(normalizeFootballFixture);
    }

    const season = String(new Date(gameStartsAt).getUTCFullYear());

    if (isNbaGame) {
      const data = await apiSportsGet<NbaGamesResponse>("nba", "/games", {
        team: teamId,
        season,
      });
      return data.response.map(normalizeNbaGame);
    }

    const data = await apiSportsGet<BasketballGamesResponse>(
      "basketball",
      "/games",
      { team: teamId, season },
    );
    return data.response.map(normalizeBasketballGame);
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = parseSport(searchParams.get("sport"));
  const gameId = searchParams.get("gameId");

  if (!sport) {
    return NextResponse.json(
      { error: "sport must be basketball or football" },
      { status: 400 },
    );
  }

  if (!gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  }

  if (searchParams.get("mock") === "true") {
    return NextResponse.json({
      matchup: getMockMatchup(sport, gameId),
      isOpenRouterAvailable: Boolean(process.env.OPENROUTER_API_KEY),
    });
  }

  try {
    let game;
    const isNbaGame = sport === "basketball" && gameId.startsWith("nba:");

    if (sport === "football") {
      game = (
        await apiSportsGet<FootballFixturesResponse>(sport, "/fixtures", {
          id: gameId,
        })
      ).response.map(normalizeFootballFixture)[0];
    } else if (isNbaGame) {
      game = (
        await apiSportsGet<NbaGamesResponse>("nba", "/games", {
          id: gameId.replace("nba:", ""),
        })
      ).response.map(normalizeNbaGame)[0];
    } else {
      game = (
        await apiSportsGet<BasketballGamesResponse>(sport, "/games", {
          id: gameId,
        })
      ).response.map(normalizeBasketballGame)[0];
    }

    if (!game) {
      return NextResponse.json({ error: "Matchup not found" }, { status: 404 });
    }

    let homeMetrics = buildMatchupMetrics(sport, game, game.homeTeam.id);
    let awayMetrics = buildMatchupMetrics(sport, game, game.awayTeam.id);
    let metricsSource: Matchup["metricsSource"] = "projected";

    if (sport === "football" && (isLiveGame(game) || isFinishedGame(game))) {
      try {
        const fixtureStats =
          await apiSportsGet<FootballStatisticsResponse>(
            "football",
            "/fixtures/statistics",
            { fixture: gameId },
          );
        const homeStats = fixtureStats.response.find(
          (item) => String(item.team.id) === game.homeTeam.id,
        );
        const awayStats = fixtureStats.response.find(
          (item) => String(item.team.id) === game.awayTeam.id,
        );

        if (homeStats && awayStats) {
          homeMetrics = buildFootballGameMetrics(homeStats);
          awayMetrics = buildFootballGameMetrics(awayStats);
          metricsSource = isFinishedGame(game) ? "game" : "live";
        }
      } catch {
        metricsSource = "projected";
      }
    }

    if (sport === "basketball" && isFinishedGame(game)) {
      try {
        if (isNbaGame) {
          const gameStats = await apiSportsGet<NbaGameStatisticsResponse>(
            "nba",
            "/games/statistics",
            { id: gameId.replace("nba:", "") },
          );
          const homeStats = gameStats.response.find(
            (item) => String(item.team.id) === game.homeTeam.id,
          );
          const awayStats = gameStats.response.find(
            (item) => String(item.team.id) === game.awayTeam.id,
          );
          const finalHomeMetrics = homeStats
            ? buildNbaGameMetrics(homeStats)
            : null;
          const finalAwayMetrics = awayStats
            ? buildNbaGameMetrics(awayStats)
            : null;

          if (finalHomeMetrics && finalAwayMetrics) {
            homeMetrics = finalHomeMetrics;
            awayMetrics = finalAwayMetrics;
            metricsSource = "game";
          }
        } else if (game.score) {
          const gameStats =
            await apiSportsGet<BasketballGameStatisticsResponse>(
              "basketball",
              "/games/statistics/teams",
              { id: gameId },
            );
          const homeStats = gameStats.response.find(
            (item) => String(item.team.id) === game.homeTeam.id,
          );
          const awayStats = gameStats.response.find(
            (item) => String(item.team.id) === game.awayTeam.id,
          );

          if (homeStats && awayStats) {
            homeMetrics = buildBasketballGameMetrics(
              homeStats,
              game.score.home,
            );
            awayMetrics = buildBasketballGameMetrics(
              awayStats,
              game.score.away,
            );
            metricsSource = "game";
          }
        }
      } catch {
        metricsSource = "projected";
      }
    }

    if (isNbaGame && metricsSource !== "game") {
      const season = new Date(game.startsAt).getUTCFullYear().toString();
      const [homeStatsResult, awayStatsResult] = await Promise.allSettled([
        apiSportsGet<NbaTeamStatisticsResponse>("nba", "/teams/statistics", {
          id: game.homeTeam.id,
          season,
        }),
        apiSportsGet<NbaTeamStatisticsResponse>("nba", "/teams/statistics", {
          id: game.awayTeam.id,
          season,
        }),
      ]);

      const seasonHomeMetrics =
        homeStatsResult.status === "fulfilled"
          ? buildNbaTeamMetrics(homeStatsResult.value.response[0])
          : null;
      const seasonAwayMetrics =
        awayStatsResult.status === "fulfilled"
          ? buildNbaTeamMetrics(awayStatsResult.value.response[0])
          : null;

      if (seasonHomeMetrics && seasonAwayMetrics) {
        homeMetrics = seasonHomeMetrics;
        awayMetrics = seasonAwayMetrics;
        metricsSource = "season";
      }
    }

    const [homeRecentGames, awayRecentGames] = await Promise.all([
      fetchRecentTeamGames(sport, isNbaGame, game.homeTeam.id, game.startsAt),
      fetchRecentTeamGames(sport, isNbaGame, game.awayTeam.id, game.startsAt),
    ]);

    const matchup: Matchup = {
      game,
      home: {
        ...game.homeTeam,
        metrics: homeMetrics,
        recentForm: buildRecentFormFromGames(
          homeRecentGames,
          game.homeTeam.id,
          game.id,
        ),
      },
      away: {
        ...game.awayTeam,
        metrics: awayMetrics,
        recentForm: buildRecentFormFromGames(
          awayRecentGames,
          game.awayTeam.id,
          game.id,
        ),
      },
      metricsSource,
    };

    return NextResponse.json({
      matchup,
      isOpenRouterAvailable: Boolean(process.env.OPENROUTER_API_KEY),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Matchup failed" },
      { status: 500 },
    );
  }
}
