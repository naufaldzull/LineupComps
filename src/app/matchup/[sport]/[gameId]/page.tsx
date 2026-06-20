"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";

import { ComparisonCharts } from "@/components/comparison-charts";
import { MatchupSummary } from "@/components/matchup-summary";
import { PlayersToWatch } from "@/components/players-to-watch";
import { ScoutReportPanel } from "@/components/scout-report-panel";
import { fetchMatchup } from "@/lib/matchup-client";
import type { Matchup, Sport } from "@/lib/types";

type MatchupPageProps = {
  params: Promise<{
    sport: string;
    gameId: string;
  }>;
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
      setError("");

      try {
        const nextMatchup = await fetchMatchup({
          sport,
          gameId,
          mock: useMockData,
        });

        if (!isMounted) {
          return;
        }

        setMatchup(nextMatchup);
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
          <div className="grid gap-5">
            <div className="animate-pulse rounded-2xl bg-[#16221a] p-5 lg:p-7">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 rounded bg-white/15" />
                <div className="h-4 w-32 rounded bg-white/10" />
              </div>
              <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/12" />
                  <div>
                    <div className="h-8 w-40 rounded bg-white/15" />
                    <div className="mt-2 h-4 w-20 rounded bg-white/10" />
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white/14" />
                <div className="flex items-center gap-4 xl:flex-row-reverse">
                  <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/12" />
                  <div>
                    <div className="h-8 w-40 rounded bg-white/15" />
                    <div className="mt-2 h-4 w-20 rounded bg-white/10" />
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl bg-white/12 p-4">
                    <div className="h-3 w-16 rounded bg-white/15" />
                    <div className="mt-3 h-7 w-20 rounded bg-white/15" />
                    <div className="mt-2 h-3 w-28 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr] xl:items-start">
              <div className="animate-pulse rounded-2xl border border-white/80 bg-white/78 p-5">
                <div className="h-6 w-48 rounded bg-[#edf1ed]" />
                <div className="mt-2 h-4 w-64 rounded bg-[#edf1ed]/60" />
                <div className="mt-5 h-96 rounded-2xl bg-[#f8faf7]" />
              </div>
              <div className="animate-pulse rounded-2xl border border-white/80 bg-white/78 p-5">
                <div className="h-6 w-36 rounded bg-[#edf1ed]" />
                <div className="mt-2 h-4 w-48 rounded bg-[#edf1ed]/60" />
                <div className="mt-5 grid gap-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 rounded-xl bg-[#edf1ed]" />
                  ))}
                </div>
              </div>
            </div>
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
              {matchup.game.sport === "basketball" ? (
                <PlayersToWatch matchup={matchup} />
              ) : null}
              <ScoutReportPanel matchup={matchup} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
