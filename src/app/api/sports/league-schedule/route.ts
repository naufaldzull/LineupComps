import { NextResponse } from "next/server";

import { REVALIDATE, apiSportsGet } from "@/lib/api-sports";
import { getLeagueById, type LeagueDef } from "@/lib/leagues";
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

const MAX_GAMES = 20;

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

// `next`/`last` sidestep the season parameter, which differs between leagues that
// run inside one calendar year and those that straddle two.
async function fetchFootballLeague(league: LeagueDef): Promise<ScheduleGame[]> {
  const [upcoming, recent] = await Promise.allSettled([
    apiSportsGet<FootballFixturesResponse>(
      "football",
      "/fixtures",
      { league: league.id, next: "15" },
      REVALIDATE.SCHEDULE,
    ),
    apiSportsGet<FootballFixturesResponse>(
      "football",
      "/fixtures",
      { league: league.id, last: "5" },
      REVALIDATE.STATIC,
    ),
  ]);

  if (upcoming.status === "rejected" && recent.status === "rejected") {
    throw upcoming.reason;
  }

  const games = [
    ...(upcoming.status === "fulfilled" ? upcoming.value.response : []),
    ...(recent.status === "fulfilled" ? recent.value.response : []),
  ].map(normalizeFootballFixture);

  return dedupeById(games).sort(byKickoff);
}

async function fetchBasketballLeague(
  league: LeagueDef,
): Promise<ScheduleGame[]> {
  const season = String(new Date().getUTCFullYear());

  if (league.apiSport === "nba") {
    const data = await apiSportsGet<NbaGamesResponse>(
      "nba",
      "/games",
      { season },
      REVALIDATE.SCHEDULE,
    );

    return dedupeById(data.response.map(normalizeNbaGame)).sort(byKickoff);
  }

  const data = await apiSportsGet<BasketballGamesResponse>(
    "basketball",
    "/games",
    { league: league.id, season },
    REVALIDATE.SCHEDULE,
  );

  return dedupeById(data.response.map(normalizeBasketballGame)).sort(byKickoff);
}

// A full season runs to hundreds of games. Anchor the window on today so the page
// shows what is about to happen plus a little recent history.
function windowAroundToday(games: ScheduleGame[]): ScheduleGame[] {
  const now = Date.now();
  const firstUpcoming = games.findIndex(
    (game) => new Date(game.startsAt).getTime() >= now,
  );

  if (firstUpcoming === -1) {
    return games.slice(-MAX_GAMES);
  }

  const start = Math.max(0, firstUpcoming - 5);

  return games.slice(start, start + MAX_GAMES);
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
        : windowAroundToday(await fetchBasketballLeague(league));

    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Schedule failed" },
      { status: 500 },
    );
  }
}
