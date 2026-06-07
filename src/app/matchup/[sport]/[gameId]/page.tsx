"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
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
          mock: "true",
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
  }, [gameId, sport]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-6 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to schedule
        </Link>

        {status === "loading" && (
          <div className="grid gap-4">
            <div className="h-40 animate-pulse rounded-lg border border-border bg-white" />
            <div className="h-96 animate-pulse rounded-lg border border-border bg-white" />
          </div>
        )}

        {status === "error" && (
          <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
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
            <div className="grid gap-5 lg:grid-cols-[1.5fr_0.9fr] lg:items-start">
              <ComparisonCharts matchup={matchup} />
              <ScoutReportPanel matchup={matchup} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
