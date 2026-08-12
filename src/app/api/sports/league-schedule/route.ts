import { NextResponse } from "next/server";

import { REVALIDATE, apiSportsGet } from "@/lib/api-sports";
import { getLeagueById, type LeagueDef } from "@/lib/leagues";
import { getMockSchedule } from "@/lib/mock-data";
import {
  normalizeBasketballGame,
  normalizeFootballFixture,
  normalizeNbaGame,
} from "@/lib/normalizers";
import { datesAroundToday } from "@/lib/schedule-utils";
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

/**
 * The free API-SPORTS plan rejects `next`, `last`, and any season outside
 * 2022-2024, so `?date=` is the only way to reach current fixtures.
 *
 * These are the same URLs the homepage schedule requests, so the Next Data
 * Cache usually serves them and a league page costs nothing extra. Filtering by
 * league happens here rather than upstream for the same reason: a
 * league-scoped URL would be a separate, uncached request.
 */
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

function byKickoff(first: ScheduleGame, second: ScheduleGame): number {
  return (
    new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime()
  );
}

// One upstream failure should not empty the whole page, so each day is settled
// independently and whatever arrived is kept.
async function gatherDays<T>(
  fetchDay: (date: string) => Promise<T[]>,
): Promise<T[]> {
  const results = await Promise.allSettled(datesAroundToday().map(fetchDay));

  if (results.every((result) => result.status === "rejected")) {
    throw (results[0] as PromiseRejectedResult).reason;
  }

  return results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
}

async function fetchFootballLeague(league: LeagueDef): Promise<ScheduleGame[]> {
  const games = await gatherDays(async (date) => {
    const data = await apiSportsGet<FootballFixturesResponse>(
      "football",
      "/fixtures",
      { date },
      REVALIDATE.SCHEDULE,
    );

    return data.response.map(normalizeFootballFixture);
  });

  return dedupeById(games.filter((game) => game.leagueId === league.id)).sort(
    byKickoff,
  );
}

async function fetchBasketballLeague(
  league: LeagueDef,
): Promise<ScheduleGame[]> {
  if (league.apiSport === "nba") {
    const games = await gatherDays(async (date) => {
      const data = await apiSportsGet<NbaGamesResponse>(
        "nba",
        "/games",
        { date },
        REVALIDATE.SCHEDULE,
      );

      return data.response.map(normalizeNbaGame);
    });

    return dedupeById(games).sort(byKickoff);
  }

  const games = await gatherDays(async (date) => {
    const data = await apiSportsGet<BasketballGamesResponse>(
      "basketball",
      "/games",
      { date },
      REVALIDATE.SCHEDULE,
    );

    return data.response.map(normalizeBasketballGame);
  });

  // Filtering on the id alone is enough and is the only safe test here: the
  // WNBA is named "NBA W" upstream, so a name-based NBA guard would drop it.
  return dedupeById(
    games.filter((game) => game.leagueId === league.id),
  ).sort(byKickoff);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = parseSport(searchParams.get("sport"));
  const leagueId = searchParams.get("leagueId");

  if (!sport) {
    return NextResponse.json(
      { error: "sport must be basketball or football" },
      { status: 400 },
    );
  }

  if (!leagueId) {
    return NextResponse.json({ error: "leagueId is required" }, { status: 400 });
  }

  const league = getLeagueById(sport, leagueId);

  if (!league) {
    return NextResponse.json({ error: "Unknown league" }, { status: 400 });
  }

  if (searchParams.get("mock") === "true") {
    return NextResponse.json({ games: getMockSchedule(sport) });
  }

  try {
    const games =
      sport === "football"
        ? await fetchFootballLeague(league)
        : await fetchBasketballLeague(league);

    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Schedule failed" },
      { status: 500 },
    );
  }
}
