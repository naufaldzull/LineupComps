import { NextResponse } from "next/server";

import { generateScoutReport } from "@/lib/openai";
import type { Matchup } from "@/lib/types";

type ScoutReportRequest = {
  matchup?: Matchup;
};

export async function POST(request: Request) {
  let body: ScoutReportRequest;

  try {
    body = (await request.json()) as ScoutReportRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.matchup?.game || !body.matchup.home || !body.matchup.away) {
    return NextResponse.json({ error: "matchup is required" }, { status: 400 });
  }

  try {
    const report = await generateScoutReport(body.matchup);

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report failed" },
      { status: 500 },
    );
  }
}
