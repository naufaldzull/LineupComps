"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronRight, Trophy } from "lucide-react";
import { useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SportTabs } from "@/components/sport-tabs";
import { getLeaguesForSport } from "@/lib/leagues";
import type { Sport } from "@/lib/types";

export default function SchedulePage() {
  const [sport, setSport] = useState<Sport>("football");
  const leagues = getLeaguesForSport(sport);

  return (
    <main className="min-h-screen bg-[#e9ecea] text-[#101513]">
      <div className="grid min-h-screen w-full grid-cols-1 overflow-hidden border-white/80 bg-[#f4f5f2]/95 shadow-[0_24px_80px_rgba(30,42,36,0.12)] lg:grid-cols-[88px_1fr]">
        <AppSidebar active="schedule" />

        <section className="min-w-0 px-4 py-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dcf4e7] text-[#1f7a4f]">
                <CalendarDays aria-hidden className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Leagues
                </h1>
                <p className="text-xs text-[#69736d]">
                  Pick a competition to see its fixtures
                </p>
              </div>
            </div>
            <SportTabs activeSport={sport} onSportChange={setSport} />
          </header>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/schedule/${sport}/${league.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-white/80 bg-white/74 p-5 shadow-sm backdrop-blur transition hover:border-[#1f7a4f]/30 hover:bg-white"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#eef1ee]">
                  {league.logoUrl ? (
                    <Image
                      src={league.logoUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <Trophy aria-hidden className="h-6 w-6 text-[#1f7a4f]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{league.name}</p>
                  <p className="truncate text-xs text-[#69736d]">
                    {league.country}
                  </p>
                </div>
                <ChevronRight
                  aria-hidden
                  className="h-5 w-5 shrink-0 text-[#a5aca7] transition group-hover:text-[#1f7a4f]"
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
