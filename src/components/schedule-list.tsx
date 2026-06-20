"use client";

import Link from "next/link";
import Image from "next/image";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  ShieldAlert,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  groupGamesByCategory,
  type CategorizedGames,
  type GameCategory,
} from "@/lib/schedule-utils";
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

const CATEGORY_CONFIG: Record<
  GameCategory,
  { label: string; icon: typeof CircleDot; emptyMessage: string }
> = {
  live: {
    label: "Live",
    icon: CircleDot,
    emptyMessage: "No live matches right now.",
  },
  upcoming: {
    label: "Upcoming",
    icon: CalendarClock,
    emptyMessage: "No upcoming matches scheduled.",
  },
  finished: {
    label: "Finished",
    icon: Trophy,
    emptyMessage: "No finished matches today.",
  },
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

export function ScheduleList({
  sport,
  useMockData,
  compact = false,
}: ScheduleListProps) {
  const [games, setGames] = useState<ScheduleGame[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">(
    "loading",
  );
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<GameCategory>("live");
  const [page, setPage] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadSchedule() {
      setStatus("loading");
      setError("");
      setPage(0);

      try {
        const query = new URLSearchParams({
          sport,
          mock: String(useMockData),
        });
        const response = await fetch(
          `/api/sports/schedule?${query.toString()}`,
        );
        const data = (await response.json()) as ScheduleResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Schedule unavailable");
        }

        if (!isMounted) {
          return;
        }

        const loaded = data.games ?? [];
        setGames(loaded);
        setStatus(loaded.length ? "ready" : "empty");

        const grouped = groupGamesByCategory(loaded);
        if (grouped.live.length) {
          setActiveTab("live");
        } else if (grouped.upcoming.length) {
          setActiveTab("upcoming");
        } else {
          setActiveTab("finished");
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Schedule unavailable",
        );
        setStatus("error");
      }
    }

    void loadSchedule();

    return () => {
      isMounted = false;
    };
  }, [sport, useMockData]);

  const grouped: CategorizedGames = useMemo(
    () => groupGamesByCategory(games),
    [games],
  );

  const label = useMemo(
    () => (sport === "football" ? "Football" : "Basketball"),
    [sport],
  );

  if (status === "loading") {
    return (
      <div className="grid gap-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-8 w-20 animate-pulse rounded-xl bg-[#edf1ed]"
            />
          ))}
        </div>
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-2xl border border-white/80 bg-[#f8faf7]/86 p-4"
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-20 rounded bg-[#edf1ed]" />
              <div className="h-3 w-28 rounded bg-[#edf1ed]/60" />
            </div>
            <div
              className={`mt-3 flex items-center gap-3 ${compact ? "" : "justify-between"}`}
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#e4eee7]" />
                <div className="h-4 w-24 rounded bg-[#edf1ed]" />
              </div>
              {!compact && (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 rounded bg-[#edf1ed]" />
                  <div className="h-8 w-8 rounded-full bg-[#e4eee7]" />
                </div>
              )}
            </div>
          </div>
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

  const activeGames = grouped[activeTab];

  return (
    <div className="grid gap-3">
      <CategoryTabs
        activeTab={activeTab}
        grouped={grouped}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setPage(0);
        }}
      />
      <GameList
        compact={compact}
        games={activeGames}
        page={page}
        setPage={setPage}
        useMockData={useMockData}
        emptyMessage={CATEGORY_CONFIG[activeTab].emptyMessage}
      />
    </div>
  );
}

function CategoryTabs({
  activeTab,
  grouped,
  onTabChange,
}: {
  activeTab: GameCategory;
  grouped: CategorizedGames;
  onTabChange: (tab: GameCategory) => void;
}) {
  const tabs: GameCategory[] = ["live", "upcoming", "finished"];

  return (
    <div className="flex gap-1.5">
      {tabs.map((tab) => {
        const config = CATEGORY_CONFIG[tab];
        const Icon = config.icon;
        const count = grouped[tab].length;
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              isActive
                ? tab === "live"
                  ? "bg-[#1f7a4f] text-white"
                  : "bg-[#16221a] text-white"
                : "bg-[#edf1ed] text-[#52605a] hover:bg-[#dfe4df]"
            }`}
          >
            <Icon
              aria-hidden
              className={`h-3 w-3 ${isActive && tab === "live" ? "fill-[#34d36f]" : ""}`}
            />
            {config.label}
            {count > 0 && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-white text-[#52605a]"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function GameList({
  compact,
  games,
  page,
  setPage,
  useMockData,
  emptyMessage,
}: {
  compact: boolean;
  games: ScheduleGame[];
  page: number;
  setPage: (updater: (current: number) => number) => void;
  useMockData: boolean;
  emptyMessage: string;
}) {
  const pageSize = compact ? 3 : 6;
  const pageCount = Math.max(1, Math.ceil(games.length / pageSize));
  const pageStart = page * pageSize;
  const visibleGames = games.slice(pageStart, pageStart + pageSize);
  const currentRangeStart = games.length ? pageStart + 1 : 0;
  const currentRangeEnd = Math.min(pageStart + pageSize, games.length);

  if (!games.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#bfc9c1] bg-[#f8faf7] p-5 text-center">
        <p className="text-sm text-[#69736d]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-2.5">
        {visibleGames.map((game) => (
          <Link
            key={game.id}
            href={`/matchup/${game.sport}/${game.id}${
              useMockData ? "?mock=true" : ""
            }`}
            className="group cursor-pointer rounded-2xl border border-white/80 bg-[#f8faf7]/86 p-4 shadow-sm transition duration-200 hover:border-[#8bc6a1] hover:bg-white hover:shadow-md"
          >
            <div
              className={`flex flex-col gap-3 ${
                compact ? "" : "sm:flex-row sm:items-center sm:justify-between"
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[#6d7670]">
                  <span>{game.league}</span>
                  <span aria-hidden>/</span>
                  <span>{formatDate(game.startsAt)}</span>
                </div>
                <div
                  className={`mt-3 grid gap-2 font-semibold text-[#101513] ${
                    compact
                      ? "text-sm"
                      : "text-base sm:grid-cols-[1fr_auto_1fr] sm:items-center"
                  }`}
                >
                  <TeamLabel
                    logoUrl={game.homeTeam.logoUrl}
                    name={game.homeTeam.name}
                  />
                  <span
                    className={
                      game.score
                        ? "w-fit rounded-lg bg-[#16221a] px-2.5 py-1 text-sm font-bold text-white"
                        : "text-[11px] font-semibold uppercase text-[#7d8580]"
                    }
                  >
                    {game.score
                      ? `${game.score.home} - ${game.score.away}`
                      : "vs"}
                  </span>
                  <TeamLabel
                    align={compact ? "left" : "right"}
                    logoUrl={game.awayTeam.logoUrl}
                    name={game.awayTeam.name}
                  />
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

      {games.length > pageSize ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-[#eef3ef]/80 p-2">
          <button
            type="button"
            aria-label="Previous schedule page"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl bg-white text-[#1f7a4f] shadow-sm transition hover:bg-[#dcf4e7] disabled:cursor-not-allowed disabled:text-[#a8b1ab] disabled:shadow-none"
          >
            <ChevronLeft aria-hidden className="h-5 w-5" />
          </button>
          <div className="min-w-0 text-center">
            <p className="text-xs font-semibold text-[#1f2a24]">
              {currentRangeStart}-{currentRangeEnd} of {games.length}
            </p>
            <p className="text-[11px] text-[#69736d]">
              Page {page + 1} / {pageCount}
            </p>
          </div>
          <button
            type="button"
            aria-label="Next schedule page"
            disabled={page >= pageCount - 1}
            onClick={() =>
              setPage((current) => Math.min(pageCount - 1, current + 1))
            }
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl bg-white text-[#1f7a4f] shadow-sm transition hover:bg-[#dcf4e7] disabled:cursor-not-allowed disabled:text-[#a8b1ab] disabled:shadow-none"
          >
            <ChevronRight aria-hidden className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </>
  );
}

function TeamLabel({
  align = "left",
  logoUrl,
  name,
}: {
  align?: "left" | "right";
  logoUrl?: string;
  name: string;
}) {
  const logo = logoUrl ? (
    <Image
      alt=""
      aria-hidden
      className="h-8 w-8 rounded-full object-contain"
      height={32}
      src={logoUrl}
      width={32}
    />
  ) : (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e4eee7] text-[11px] text-[#1f7a4f]">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );

  return (
    <span
      className={`flex min-w-0 items-center gap-2 ${
        align === "right" ? "sm:flex-row-reverse sm:text-right" : ""
      }`}
    >
      {logo}
      <span className="truncate">{name}</span>
    </span>
  );
}
