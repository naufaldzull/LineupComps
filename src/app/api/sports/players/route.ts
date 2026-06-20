import { NextResponse } from "next/server";

import { apiSportsGet } from "@/lib/api-sports";
import {
  normalizeNbaPlayerRows,
  selectTopPlayerEvidence,
} from "@/lib/basketball-report-context";
import {
  normalizeBasketballRoster,
  normalizeFootballLineup,
  type RosterPlayer,
} from "@/lib/player-roster";

type ApiResponse<T> = {
  response: T[];
};

type PlayersResponse = {
  source: "current stats" | "last available roster" | "match lineup";
  season: string;
  teams: {
    home: RosterPlayer[];
    away: RosterPlayer[];
  };
};

function currentNbaSeason(startsAt: string): string {
  const date = new Date(startsAt);
  const year = date.getUTCFullYear();

  return String(date.getUTCMonth() < 7 ? year - 1 : year);
}

async function fetchNbaPlayers(
  teamId: string,
  season: string,
): Promise<RosterPlayer[]> {
  const data = await apiSportsGet<ApiResponse<unknown>>(
    "nba",
    "/players/statistics",
    { team: teamId, season },
  );

  return selectTopPlayerEvidence(normalizeNbaPlayerRows(data.response)).map(
    (player) => ({
      id: player.id,
      name: player.name,
      statLine: player.statLine,
    }),
  );
}

async function fetchBasketballRoster(teamId: string) {
  const data = await apiSportsGet<
    ApiResponse<Parameters<typeof normalizeBasketballRoster>[0][number]>
  >("basketball", "/players", {
    team: teamId,
    season: "2024-2025",
  });

  return normalizeBasketballRoster(data.response);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");
  const homeTeamId = searchParams.get("homeTeamId");
  const awayTeamId = searchParams.get("awayTeamId");
  const startsAt = searchParams.get("startsAt");
  const league = searchParams.get("league") ?? "";
  const sport = searchParams.get("sport") ?? "basketball";

  if (!gameId || !homeTeamId || !awayTeamId || !startsAt) {
    return NextResponse.json(
      { error: "gameId, team ids, and startsAt are required" },
      { status: 400 },
    );
  }

  try {
    let payload: PlayersResponse;

    if (sport === "football") {
      const data = await apiSportsGet<ApiResponse<unknown>>(
        "football",
        "/fixtures/lineups",
        { fixture: gameId },
      );

      const lineups = normalizeFootballLineup(
        data.response,
        homeTeamId,
        awayTeamId,
      );

      payload = {
        source: lineups.home.length ? "match lineup" : "last available roster",
        season: new Date(startsAt).getUTCFullYear().toString(),
        teams: lineups,
      };
    } else if (gameId.startsWith("nba:")) {
      const season = currentNbaSeason(startsAt);
      const [home, away] = await Promise.all([
        fetchNbaPlayers(homeTeamId, season),
        fetchNbaPlayers(awayTeamId, season),
      ]);
      payload = {
        source: "current stats",
        season,
        teams: { home, away },
      };
    } else if (/^nba(?:\s|$)/i.test(league.trim())) {
      return NextResponse.json(
        {
          error:
            "This duplicate NBA fixture came from API-Basketball. Return to the schedule and open the API-NBA fixture for current players.",
        },
        { status: 409 },
      );
    } else {
      const [home, away] = await Promise.all([
        fetchBasketballRoster(homeTeamId),
        fetchBasketballRoster(awayTeamId),
      ]);
      payload = {
        source: "last available roster",
        season: "2024-2025",
        teams: { home, away },
      };
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Player data unavailable",
      },
      { status: 500 },
    );
  }
}
