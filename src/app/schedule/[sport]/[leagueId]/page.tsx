"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { use, useMemo } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { ScheduleList } from "@/components/schedule-list";
import { getLeagueById } from "@/lib/leagues";
import type { Sport } from "@/lib/types";

type LeagueSchedulePageProps = {
  params: Promise<{
    sport: string;
    leagueId: string;
  }>;
};

function parseSport(value: string): Sport | null {
  return value === "basketball" || value === "football" ? value : null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#e9ecea] text-[#101513]">
      <div className="grid min-h-screen w-full grid-cols-1 overflow-hidden border-white/80 bg-[#f4f5f2]/95 shadow-[0_24px_80px_rgba(30,42,36,0.12)] lg:grid-cols-[88px_1fr]">
        <AppSidebar active="schedule" />
        <section className="min-w-0 px-4 py-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          {children}
        </section>
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/schedule"
      className="inline-flex items-center gap-2 text-xs font-semibold text-[#69736d] transition hover:text-[#101513]"
    >
      <ArrowLeft aria-hidden className="h-4 w-4" />
      All leagues
    </Link>
  );
}

export default function LeagueSchedulePage({
  params,
}: LeagueSchedulePageProps) {
  const { sport: sportParam, leagueId } = use(params);
  const sport = parseSport(sportParam);
  const searchParams = useSearchParams();
  const useMockData = searchParams.get("mock") === "true";
  const league = sport ? getLeagueById(sport, leagueId) : undefined;

  const endpoint = useMemo(() => {
    if (!sport || !league) {
      return undefined;
    }

    const query = new URLSearchParams({
      sport,
      leagueId: league.id,
      mock: String(useMockData),
    });

    return `/api/sports/league-schedule?${query.toString()}`;
  }, [sport, league, useMockData]);

  if (!sport || !league || !endpoint) {
    return (
      <Shell>
        <BackLink />
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#f3d6d6] bg-[#fdf3f3] p-5">
          <ShieldAlert aria-hidden className="h-5 w-5 shrink-0 text-[#b4413f]" />
          <div>
            <p className="text-sm font-semibold text-[#7c2c2b]">
              League not found
            </p>
            <p className="mt-1 text-xs text-[#9a5654]">
              That competition is not in the tracked list.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <BackLink />

      <header className="mb-6 mt-4 flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm">
          {league.logoUrl ? (
            <Image
              src={league.logoUrl}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
          ) : (
            <Trophy aria-hidden className="h-6 w-6 text-[#1f7a4f]" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {league.name}
          </h1>
          <p className="text-xs text-[#69736d]">{league.country}</p>
        </div>
      </header>

      <div className="rounded-2xl border border-white/80 bg-white/74 p-5 shadow-sm backdrop-blur">
        <ScheduleList
          sport={sport}
          useMockData={useMockData}
          endpoint={endpoint}
        />
      </div>
    </Shell>
  );
}
