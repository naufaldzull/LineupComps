import { NextResponse } from "next/server";

import { apiSportsGet } from "@/lib/api-sports";
import { getMockSchedule } from "@/lib/mock-data";
import {
  normalizeBasketballGame,
  normalizeFootballFixture,
  normalizeNbaGame,
} from "@/lib/normalizers";
import type { ScheduleGame, Sport } from "@/lib/types";

type FootballFixturesResponse = {
  response: Parameters<typeof normalizeFootballFixture>[0][];
};

type BasketballGamesResponse = {
  response: Parameters<typeof normalizeBasketballGame>[0][];
};

type NbaGamesResponse = {
  response: Parameters<typeof normalizeNbaGame>[0][];
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
    let games: ScheduleGame[];

    if (sport === "football") {
      games = (
        await apiSportsGet<FootballFixturesResponse>(sport, "/fixtures", {
          date,
        })
      ).response.map(normalizeFootballFixture);
    } else {
      const [nbaGamesResult, basketballGamesResult] = await Promise.allSettled([
        apiSportsGet<NbaGamesResponse>("nba", "/games", { date }),
        apiSportsGet<BasketballGamesResponse>(sport, "/games", { date }),
      ]);

      if (
        nbaGamesResult.status === "rejected" &&
        basketballGamesResult.status === "rejected"
      ) {
        throw new Error("Basketball schedule providers failed");
      }

      games = [];

      if (nbaGamesResult.status === "fulfilled") {
        games.push(...nbaGamesResult.value.response.map(normalizeNbaGame));
      }

      if (basketballGamesResult.status === "fulfilled") {
        games.push(
          ...basketballGamesResult.value.response.map(normalizeBasketballGame),
        );
      }
    }

    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Schedule failed" },
      { status: 500 },
    );
  }
}
