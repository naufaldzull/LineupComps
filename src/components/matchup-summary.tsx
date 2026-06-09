import Image from "next/image";
import { ArrowLeftRight, CalendarClock, Gauge, Trophy } from "lucide-react";

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
      <p className="text-xs font-semibold uppercase tracking-normal text-white/62">
        {label}
      </p>
      <div className="mt-2 flex gap-1.5">
        {(form ?? ["-", "-", "-", "-", "-"]).map((result, index) => (
          <span
            key={`${result}-${index}`}
            className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${
              result === "W"
                ? "bg-[#d7f8df] text-[#0f7a38]"
                : result === "L"
                  ? "bg-[#ffe0df] text-[#9c2b23]"
                  : result === "D"
                    ? "bg-[#fff1d8] text-[#9a5a00]"
                    : "bg-white/12 text-white/70"
            }`}
          >
            {result}
          </span>
        ))}
      </div>
    </div>
  );
}

function TeamLogo({ logoUrl, name }: { logoUrl?: string; name: string }) {
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/22 bg-white/12">
      {logoUrl ? (
        <Image
          alt=""
          aria-hidden
          className="object-contain p-2"
          fill
          sizes="64px"
          src={logoUrl}
        />
      ) : (
        <span className="grid h-full w-full place-items-center text-lg font-bold text-white">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function MatchupSummary({ matchup }: MatchupSummaryProps) {
  const homeLeadMetric = matchup.home.metrics[0];
  const awayLeadMetric = matchup.away.metrics[0];

  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#16221a] p-5 text-white shadow-sm lg:p-7">
      <div className="absolute inset-0 opacity-95 [background:linear-gradient(120deg,rgba(31,122,79,.95),rgba(25,56,39,.92)),repeating-linear-gradient(90deg,rgba(255,255,255,.06)_0_1px,transparent_1px_86px),repeating-linear-gradient(0deg,rgba(255,255,255,.04)_0_1px,transparent_1px_72px)]" />
      <div className="absolute -right-14 top-8 h-56 w-56 rounded-full border border-white/12" />
      <div className="absolute bottom-8 right-10 h-28 w-36 rounded-2xl border border-white/35 bg-white/10 backdrop-blur" />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white/72">
              <CalendarClock aria-hidden className="h-4 w-4" />
              <span>{matchup.game.league}</span>
              <span aria-hidden>/</span>
              <span>{formatDate(matchup.game.startsAt)}</span>
              {matchup.game.status ? (
                <span className="rounded-full bg-white/14 px-3 py-1 text-xs text-white">
                  {matchup.game.status}
                </span>
              ) : null}
            </div>
            <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <TeamLogo logoUrl={matchup.home.logoUrl} name={matchup.home.name} />
                <div className="min-w-0">
                  <p className="truncate text-3xl font-semibold tracking-normal lg:text-4xl">
                    {matchup.home.name}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#b9f4ce]">
                    Home side
                  </p>
                </div>
              </div>
              {matchup.game.score ? (
                <div className="min-w-28 rounded-2xl bg-white/14 px-4 py-3 text-center text-white backdrop-blur">
                  <p className="text-3xl font-bold">
                    {matchup.game.score.home} - {matchup.game.score.away}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase text-white/62">
                    {matchup.game.status ?? "Score"}
                  </p>
                </div>
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/14 text-white">
                  <ArrowLeftRight aria-hidden className="h-5 w-5" />
                </span>
              )}
              <div className="flex min-w-0 items-center gap-4 xl:flex-row-reverse xl:text-right">
                <TeamLogo logoUrl={matchup.away.logoUrl} name={matchup.away.name} />
                <div className="min-w-0">
                  <p className="truncate text-3xl font-semibold tracking-normal lg:text-4xl">
                    {matchup.away.name}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#b9f4ce]">
                    Away side
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormLine
              label={`${matchup.home.name} form`}
              form={matchup.home.recentForm}
            />
            <FormLine
              label={`${matchup.away.name} form`}
              form={matchup.away.recentForm}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-white/62">
              <Trophy aria-hidden className="h-4 w-4" />
              Fixture
            </div>
            <p className="mt-3 text-2xl font-semibold capitalize">
              {matchup.game.sport}
            </p>
            <p className="mt-1 text-xs text-white/62">Live API matchup detail</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-white/62">
              <Gauge aria-hidden className="h-4 w-4" />
              {homeLeadMetric?.label ?? "Home signal"}
            </div>
            <p className="mt-3 text-2xl font-semibold">
              {homeLeadMetric?.displayValue ?? homeLeadMetric?.value ?? "-"}
            </p>
            <p className="mt-1 truncate text-xs text-white/62">
              {matchup.home.name}
            </p>
          </div>
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-white/62">
              <Gauge aria-hidden className="h-4 w-4" />
              {awayLeadMetric?.label ?? "Away signal"}
            </div>
            <p className="mt-3 text-2xl font-semibold">
              {awayLeadMetric?.displayValue ?? awayLeadMetric?.value ?? "-"}
            </p>
            <p className="mt-1 truncate text-xs text-white/62">
              {matchup.away.name}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
