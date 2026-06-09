"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";

import { ComparisonCharts } from "@/components/comparison-charts";
import { MatchupSummary } from "@/components/matchup-summary";
import { ScoutReportPanel } from "@/components/scout-report-panel";
import type { Matchup, Sport } from "@/lib/types";

type MatchupPageProps = {
  params: Promise<{
    sport: string;
    gameId: string;
  }>;
};

type MatchupResponse = {
  matchup?: Matchup;
  error?: string;
};

function parseSport(value: string): Sport | null {
  return value === "basketball" || value === "football" ? value : null;
}

export default function MatchupPage({ params }: MatchupPageProps) {
  const { sport: sportParam, gameId } = use(params);
  const sport = parseSport(sportParam);
  const searchParams = useSearchParams();
  const useMockData = searchParams.get("mock") === "true";
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMatchup() {
      if (!sport) {
        setError("Unknown sport");
        setStatus("error");
        return;
      }

      setStatus("loading");

      try {
        const query = new URLSearchParams({
          sport,
          gameId,
          mock: String(useMockData),
        });
        const response = await fetch(`/api/sports/matchup?${query.toString()}`);
        const data = (await response.json()) as MatchupResponse;

        if (!response.ok || !data.matchup) {
          throw new Error(data.error ?? "Matchup unavailable");
        }

        if (!isMounted) {
          return;
        }

        setMatchup(data.matchup);
        setStatus("ready");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "Matchup unavailable",
        );
        setStatus("error");
      }
    }

    void loadMatchup();

    return () => {
      isMounted = false;
    };
  }, [gameId, sport, useMockData]);

  return (
    <main className="min-h-screen bg-[#e9ecea] text-[#101513]">
      <div className="flex min-h-screen w-full flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm font-semibold text-[#101513] shadow-sm transition hover:border-[#8bc6a1] hover:text-[#1f7a4f]"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to schedule
        </Link>

        {status === "loading" && (
          <div className="grid gap-4">
            <div className="h-56 animate-pulse rounded-2xl border border-white/80 bg-white/80" />
            <div className="h-96 animate-pulse rounded-2xl border border-white/80 bg-white/80" />
          </div>
        )}

        {status === "error" && (
          <section className="rounded-2xl border border-white/80 bg-white/80 p-6 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
              <ShieldAlert aria-hidden className="h-5 w-5 text-accent" />
              Matchup error
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </section>
        )}

        {status === "ready" && matchup && (
          <>
            <MatchupSummary matchup={matchup} />
            <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr] xl:items-start">
              <ComparisonCharts matchup={matchup} />
              <ScoutReportPanel matchup={matchup} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
