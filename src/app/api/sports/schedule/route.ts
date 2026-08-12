import { NextResponse } from "next/server";

import { apiSportsGet } from "@/lib/api-sports";
import { isHotLeague } from "@/lib/leagues";
import { getMockSchedule } from "@/lib/mock-data";
import {
  normalizeBasketballGame,
  normalizeFootballFixture,
  normalizeNbaGame,
} from "@/lib/normalizers";
import {
  combineBasketballSchedules,
  datesAroundToday,
} from "@/lib/schedule-utils";
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

function dedupeById(games: ScheduleGame[]): ScheduleGame[] {
  const seen = new Set<string>();

  return games.filter((game) => {
    if (seen.has(game.id)) {
      return false;
    }

    seen.add(game.id);
    return true;
  });
}

async function fetchFootballDay(date: string): Promise<ScheduleGame[]> {
  const data = await apiSportsGet<FootballFixturesResponse>(
    "football",
    "/fixtures",
    { date },
  );

  return data.response.map(normalizeFootballFixture);
}

async function fetchBasketballDay(date: string): Promise<ScheduleGame[]> {
  const [nbaResult, basketballResult] = await Promise.allSettled([
    apiSportsGet<NbaGamesResponse>("nba", "/games", { date }),
    apiSportsGet<BasketballGamesResponse>("basketball", "/games", { date }),
  ]);

  if (nbaResult.status === "rejected" && basketballResult.status === "rejected") {
    throw nbaResult.reason;
  }

  const nbaGames =
    nbaResult.status === "fulfilled"
      ? nbaResult.value.response.map(normalizeNbaGame)
      : [];
  const basketballGames =
    basketballResult.status === "fulfilled"
      ? basketballResult.value.response.map(normalizeBasketballGame)
      : [];

  return combineBasketballSchedules(
    nbaGames,
    basketballGames,
    nbaResult.status === "fulfilled",
  );
}

// One bad day should not empty the whole schedule, so days are settled
// independently and whatever arrived is kept.
async function fetchDays(
  dates: string[],
  fetchDay: (date: string) => Promise<ScheduleGame[]>,
): Promise<ScheduleGame[]> {
  const results = await Promise.allSettled(dates.map(fetchDay));

  if (results.every((result) => result.status === "rejected")) {
    throw (results[0] as PromiseRejectedResult).reason;
  }

  return dedupeById(
    results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    ),
  );
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

  const explicitDate = searchParams.get("date");
  // Restricting to curated leagues can empty a single day — mid-week in August
  // none of them play — so the hot view spans yesterday through tomorrow.
  const dates = explicitDate
    ? [explicitDate]
    : searchParams.get("days") === "3"
      ? datesAroundToday()
      : datesAroundToday(0);

  try {
    let games = await fetchDays(
      dates,
      sport === "football" ? fetchFootballDay : fetchBasketballDay,
    );

    // Same upstream calls either way — this only narrows what we hand back, so
    // the homepage never surfaces an obscure competition.
    if (searchParams.get("hot") === "true") {
      games = games.filter(isHotLeague);
    }

    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Schedule failed" },
      { status: 500 },
    );
  }
}
