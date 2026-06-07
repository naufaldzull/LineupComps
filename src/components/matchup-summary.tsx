import { ArrowLeftRight, CalendarClock } from "lucide-react";

import type { Matchup } from "@/lib/types";

type MatchupSummaryProps = {
  matchup: Matchup;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function FormLine({ label, form }: { label: string; form?: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex gap-1.5">
        {(form ?? ["-", "-", "-", "-", "-"]).map((result, index) => (
          <span
            key={`${result}-${index}`}
            className="grid h-7 w-7 place-items-center rounded-md bg-muted text-xs font-semibold text-foreground"
          >
            {result}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MatchupSummary({ matchup }: MatchupSummaryProps) {
  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarClock aria-hidden className="h-4 w-4" />
            <span>{matchup.game.league}</span>
            <span aria-hidden>•</span>
            <span>{formatDate(matchup.game.startsAt)}</span>
          </div>
          <div className="mt-4 grid gap-3 text-2xl font-bold text-foreground sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <span className="min-w-0 truncate">{matchup.home.name}</span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
              <ArrowLeftRight aria-hidden className="h-5 w-5" />
            </span>
            <span className="min-w-0 truncate sm:text-right">
              {matchup.away.name}
            </span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormLine label={`${matchup.home.name} form`} form={matchup.home.recentForm} />
          <FormLine label={`${matchup.away.name} form`} form={matchup.away.recentForm} />
        </div>
      </div>
    </section>
  );
}
