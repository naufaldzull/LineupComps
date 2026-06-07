import { NextResponse } from "next/server";

import { apiSportsGet, buildMatchupMetrics } from "@/lib/api-sports";
import { getMockMatchup } from "@/lib/mock-data";
import {
  normalizeBasketballGame,
  normalizeFootballFixture,
} from "@/lib/normalizers";
import type { Matchup, Sport } from "@/lib/types";

type FootballFixturesResponse = {
  response: Parameters<typeof normalizeFootballFixture>[0][];
};

type BasketballGamesResponse = {
  response: Parameters<typeof normalizeBasketballGame>[0][];
};

function parseSport(value: string | null): Sport | null {
  return value === "basketball" || value === "football" ? value : null;
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
    return NextResponse.json({ matchup: getMockMatchup(sport, gameId) });
  }

  try {
    const game =
      sport === "football"
        ? (
            await apiSportsGet<FootballFixturesResponse>(sport, "/fixtures", {
              id: gameId,
            })
          ).response.map(normalizeFootballFixture)[0]
        : (
            await apiSportsGet<BasketballGamesResponse>(sport, "/games", {
              id: gameId,
            })
          ).response.map(normalizeBasketballGame)[0];

    if (!game) {
      return NextResponse.json({ error: "Matchup not found" }, { status: 404 });
    }

    const metrics = buildMatchupMetrics(sport);
    const matchup: Matchup = {
      game,
      home: { ...game.homeTeam, metrics },
      away: { ...game.awayTeam, metrics },
    };

    return NextResponse.json({ matchup });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Matchup failed" },
      { status: 500 },
    );
  }
}
