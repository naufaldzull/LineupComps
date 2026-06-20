import { NextResponse } from "next/server";

import { apiSportsGet } from "@/lib/api-sports";
import { getMockSchedule } from "@/lib/mock-data";
import {
  normalizeBasketballGame,
  normalizeFootballFixture,
  normalizeNbaGame,
} from "@/lib/normalizers";
import { combineBasketballSchedules } from "@/lib/schedule-utils";
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

function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  return dates;
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

  const dateParam = searchParams.get("date");

  try {
    let games: ScheduleGame[];

    if (sport === "football") {
      if (dateParam) {
        games = (
          await apiSportsGet<FootballFixturesResponse>(sport, "/fixtures", {
            date: dateParam,
          })
        ).response.map(normalizeFootballFixture);
      } else {
        const dates = getDateRange(4);
        const results = await Promise.allSettled(
          dates.map((d) =>
            apiSportsGet<FootballFixturesResponse>(sport, "/fixtures", {
              date: d,
            }),
          ),
        );
        games = results.flatMap((r) =>
          r.status === "fulfilled"
            ? r.value.response.map(normalizeFootballFixture)
            : [],
        );
      }
    } else {
      const dates = dateParam ? [dateParam] : getDateRange(4);
      const allNba: ScheduleGame[] = [];
      const allBball: ScheduleGame[] = [];
      let nbaAvailable = false;

      const results = await Promise.allSettled(
        dates.flatMap((d) => [
          apiSportsGet<NbaGamesResponse>("nba", "/games", { date: d }).then(
            (r) => ({ provider: "nba" as const, response: r.response, date: d }),
          ),
          apiSportsGet<BasketballGamesResponse>(sport, "/games", {
            date: d,
          }).then((r) => ({
            provider: "bball" as const,
            response: r.response,
            date: d,
          })),
        ]),
      );

      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        const { provider, response } = result.value;
        if (provider === "nba") {
          allNba.push(...response.map(normalizeNbaGame));
          nbaAvailable = true;
        } else {
          allBball.push(...response.map(normalizeBasketballGame));
        }
      }

      if (!allNba.length && !allBball.length && !dateParam) {
        throw new Error("Basketball schedule providers failed");
      }

      games = combineBasketballSchedules(allNba, allBball, nbaAvailable);
    }

    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Schedule failed" },
      { status: 500 },
    );
  }
}
