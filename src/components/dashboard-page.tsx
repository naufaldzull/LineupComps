"use client";

import { Activity, Brain, Trophy } from "lucide-react";
import { useState } from "react";

import { ScheduleList } from "@/components/schedule-list";
import { SportTabs } from "@/components/sport-tabs";
import type { Sport } from "@/lib/types";

type DashboardPageProps = {
  useMockData: boolean;
};

export function DashboardPage({ useMockData }: DashboardPageProps) {
  const [sport, setSport] = useState<Sport>("football");

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                <Trophy aria-hidden className="h-5 w-5" />
                LineupComps
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
                Sports matchup intelligence from the schedule up.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Pick a sport, open an upcoming matchup, and compare team form
                before generating an AI scouting brief.
              </p>
            </div>
            <SportTabs activeSport={sport} onSportChange={setSport} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <Activity aria-hidden className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">Live-style schedule</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Mock data by default, API-SPORTS ready with mock=false.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <Brain aria-hidden className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">AI scouting reports</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Built around strengths, weaknesses, and watch points.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <Trophy aria-hidden className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">Basketball + football</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                One comparison model for two sports.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Upcoming matchups
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start from a scheduled game, then open the comparison room.
            </p>
          </div>
        </div>
        <ScheduleList sport={sport} useMockData={useMockData} />
      </section>
    </main>
  );
}
