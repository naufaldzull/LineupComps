import { NextResponse } from "next/server";

import { getMockMatchup } from "@/lib/mock-data";
import type { Sport } from "@/lib/types";

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

  return NextResponse.json({ matchup: getMockMatchup(sport, gameId) });
}
