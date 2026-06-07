import { NextResponse } from "next/server";

import { apiSportsGet } from "@/lib/api-sports";
import { getMockSchedule } from "@/lib/mock-data";
import {
  normalizeBasketballGame,
  normalizeFootballFixture,
} from "@/lib/normalizers";
import type { ScheduleGame, Sport } from "@/lib/types";

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

  if (!sport) {
    return NextResponse.json(
      { error: "sport must be basketball or football" },
      { status: 400 },
    );
  }

  if (searchParams.get("mock") === "true") {
    return NextResponse.json({ games: getMockSchedule(sport) });
  }

  const date =
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  try {
    const games: ScheduleGame[] =
      sport === "football"
        ? (
            await apiSportsGet<FootballFixturesResponse>(sport, "/fixtures", {
              date,
            })
          ).response.map(normalizeFootballFixture)
        : (
            await apiSportsGet<BasketballGamesResponse>(sport, "/games", {
              date,
            })
          ).response.map(normalizeBasketballGame);

    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Schedule failed" },
      { status: 500 },
    );
  }
}
