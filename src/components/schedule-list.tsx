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

export function ScheduleList({ sport, useMockData }: ScheduleListProps) {
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
            className="h-28 animate-pulse rounded-lg border border-border bg-white"
          />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-lg border border-border bg-white p-6">
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
      <div className="rounded-lg border border-border bg-white p-6">
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
    <div className="grid gap-3">
      {games.map((game) => (
        <Link
          key={game.id}
          href={`/matchup/${game.sport}/${game.id}?mock=${String(useMockData)}`}
          className="group rounded-lg border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">
                <span>{game.league}</span>
                <span aria-hidden>/</span>
                <span>{formatDate(game.startsAt)}</span>
              </div>
              <div className="mt-3 grid gap-2 text-base font-semibold text-foreground sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <span className="truncate">{game.homeTeam.name}</span>
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  vs
                </span>
                <span className="truncate sm:text-right">{game.awayTeam.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {game.status ?? "Scheduled"}
              </span>
              <ChevronRight
                aria-hidden
                className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
