"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { ScheduleGame, Sport } from "@/lib/types";

type ScheduleResponse = {
  games?: ScheduleGame[];
  error?: string;
};

type ScheduleListProps = {
  sport: Sport;
  useMockData: boolean;
  compact?: boolean;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ScheduleList({ sport, useMockData, compact = false }: ScheduleListProps) {
  const [games, setGames] = useState<ScheduleGame[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">(
    "loading",
  );
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadSchedule() {
      setStatus("loading");
      setError("");

      try {
        const query = new URLSearchParams({
          sport,
          mock: String(useMockData),
        });
        const response = await fetch(`/api/sports/schedule?${query.toString()}`);
        const data = (await response.json()) as ScheduleResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Schedule unavailable");
        }

        if (!isMounted) {
          return;
        }

        setGames(data.games ?? []);
        setStatus(data.games?.length ? "ready" : "empty");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "Schedule unavailable",
        );
        setStatus("error");
      }
    }

    void loadSchedule();

    return () => {
      isMounted = false;
    };
  }, [sport, useMockData]);

  const label = useMemo(
    () => (sport === "football" ? "Football" : "Basketball"),
    [sport],
  );

  if (status === "loading") {
    return (
      <div className="grid gap-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className={`${compact ? "h-20" : "h-28"} animate-pulse rounded-2xl border border-white/80 bg-white/70`}
          />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-white/80 bg-white/80 p-5">
        <div className="flex items-center gap-3 text-sm font-medium text-foreground">
          <ShieldAlert aria-hidden className="h-5 w-5 text-accent" />
          Schedule error
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="rounded-2xl border border-white/80 bg-white/80 p-5">
        <div className="flex items-center gap-3 text-sm font-medium text-foreground">
          <CalendarClock aria-hidden className="h-5 w-5 text-primary" />
          No {label.toLowerCase()} matches found
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Try another sport or connect live API data in the environment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      {games.map((game) => (
        <Link
          key={game.id}
          href={`/matchup/${game.sport}/${game.id}?mock=${String(useMockData)}`}
          className="group cursor-pointer rounded-2xl border border-white/80 bg-[#f8faf7]/86 p-3 shadow-sm transition duration-200 hover:border-[#8bc6a1] hover:bg-white hover:shadow-md"
        >
          <div className={`flex flex-col gap-3 ${compact ? "" : "sm:flex-row sm:items-center sm:justify-between"}`}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[#6d7670]">
                <span>{game.league}</span>
                <span aria-hidden>/</span>
                <span>{formatDate(game.startsAt)}</span>
              </div>
              <div className={`mt-3 grid gap-1.5 font-semibold text-[#101513] ${compact ? "text-sm" : "text-base sm:grid-cols-[1fr_auto_1fr] sm:items-center"}`}>
                <span className="truncate">{game.homeTeam.name}</span>
                <span className="text-[11px] font-semibold uppercase text-[#7d8580]">
                  vs
                </span>
                <span className={`truncate ${compact ? "" : "sm:text-right"}`}>{game.awayTeam.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="rounded-full bg-[#dcf4e7] px-2.5 py-1 text-[11px] font-semibold text-[#1f7a4f]">
                {game.status ?? "Scheduled"}
              </span>
              <ChevronRight
                aria-hidden
                className="h-4 w-4 text-[#7d8580] transition group-hover:translate-x-0.5 group-hover:text-[#1f7a4f]"
              />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
