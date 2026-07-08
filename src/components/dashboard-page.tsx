"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  CalendarDays,
  CircleDot,
  CircleUserRound,
  Gauge,
  Goal,
  Home,
  Layers3,
  Menu,
  Moon,
  Search,
  Shield,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ScheduleList } from "@/components/schedule-list";
import { SportTabs } from "@/components/sport-tabs";
import { fetchMatchup } from "@/lib/matchup-client";
import type { Matchup, ScheduleGame, Sport } from "@/lib/types";
import type { RosterPlayer } from "@/lib/player-roster";

type DashboardPageProps = {
  dataMode: "demo" | "live";
  useMockData: boolean;
};

const navItems = [
  { label: "Home", icon: Home, active: true },
  { label: "Fixtures", icon: CalendarDays },
  { label: "Analytics", icon: BarChart3 },
  { label: "Reports", icon: Brain },
  { label: "Alerts", icon: Bell },
];

type ScheduleResponse = {
  games?: ScheduleGame[];
  error?: string;
};

type PlayersResponse = {
  source?: string;
  season?: string;
  teams?: {
    home: RosterPlayer[];
    away: RosterPlayer[];
  };
};

type FeaturedData = {
  game: ScheduleGame;
  matchup: Matchup | null;
  players: PlayersResponse | null;
};

function getQuickStats(dataMode: DashboardPageProps["dataMode"]) {
  return [
    { label: "Model confidence", value: "87%", detail: "Gemini scouting" },
    {
      label: "Data source",
      value: dataMode === "live" ? "Live" : "Demo",
      detail: dataMode === "live" ? "API-SPORTS connected" : "mock=true fallback",
    },
    { label: "Tracked sports", value: "02", detail: "Football / Basketball" },
  ];
}

export function DashboardPage({ dataMode, useMockData }: DashboardPageProps) {
  const [sport, setSport] = useState<Sport>("football");
  const [featured, setFeatured] = useState<FeaturedData | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const quickStats = getQuickStats(dataMode);

  useEffect(() => {
    let isMounted = true;

    async function loadFeatured() {
      setFeatured(null);
      setLoadingFeatured(true);

      try {
        const query = new URLSearchParams({
          sport,
          mock: String(useMockData),
        });
        const response = await fetch(`/api/sports/schedule?${query.toString()}`);
        const data = (await response.json()) as ScheduleResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Featured matchup unavailable");
        }

        const game = selectFeaturedGame(data.games ?? [], sport);

        if (!isMounted || !game) {
          if (isMounted) setLoadingFeatured(false);
          return;
        }

        setFeatured({ game, matchup: null, players: null });
        setLoadingFeatured(false);

        const [matchupResult, playersResult] = await Promise.allSettled([
          fetchMatchup({ sport, gameId: game.id, mock: useMockData }),
          fetch(
            `/api/sports/players?${new URLSearchParams({
              sport,
              gameId: game.id,
              homeTeamId: game.homeTeam.id,
              awayTeamId: game.awayTeam.id,
              startsAt: game.startsAt,
              league: game.league,
            }).toString()}`,
          ).then((r) => r.json() as Promise<PlayersResponse>),
        ]);

        if (!isMounted) return;

        setFeatured({
          game,
          matchup:
            matchupResult.status === "fulfilled" ? matchupResult.value.matchup : null,
          players:
            playersResult.status === "fulfilled" ? playersResult.value : null,
        });
      } catch {
        if (isMounted) {
          setFeatured(null);
          setLoadingFeatured(false);
        }
      }
    }

    void loadFeatured();

    return () => {
      isMounted = false;
    };
  }, [sport, useMockData]);

  const bottomCards =
    sport === "football"
      ? [
          ["Derby lens", "Rivalry view with form, possession, and xG signals."],
          ["Tempo map", "Read who controls buildup speed and transition risk."],
          ["AI brief", "Generate a tactical report from normalized matchup data."],
        ]
      : [
          ["Shot profile", "Compare pace, true shooting, and paint pressure."],
          ["Possession edge", "Track rebounds, turnover control, and tempo swings."],
          ["AI brief", "Generate a visual scouting report for the selected game."],
        ];

  return (
    <main className="min-h-screen bg-[#e9ecea] text-[#101513]">
      <div className="grid min-h-screen w-full grid-cols-1 overflow-hidden border-white/80 bg-[#f4f5f2]/95 shadow-[0_24px_80px_rgba(30,42,36,0.12)] lg:grid-cols-[88px_1fr]">
        <aside className="hidden border-r border-[#dfe4df] bg-[#ebecea] px-4 py-6 lg:flex lg:flex-col lg:items-center lg:justify-between">
          <div className="grid gap-6">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#1f7a4f] shadow-sm">
              <Trophy aria-hidden className="h-6 w-6" />
            </div>
            <nav className="grid gap-3">
              {navItems.map(({ label, icon: Icon, active }) => (
                <button
                  key={label}
                  type="button"
                  title={label}
                  className={`grid h-12 w-12 cursor-pointer place-items-center rounded-2xl transition ${
                    active
                      ? "bg-white text-[#1f7a4f] shadow-sm"
                      : "text-[#7d8580] hover:bg-white/70 hover:text-[#101513]"
                  }`}
                >
                  <Icon aria-hidden className="h-6 w-6" />
                  <span className="sr-only">{label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="grid gap-3">
            <button
              type="button"
              title="Theme"
              className="grid h-12 w-12 cursor-pointer place-items-center rounded-2xl text-[#7d8580] transition hover:bg-white/70 hover:text-[#101513]"
            >
              <Moon aria-hidden className="h-6 w-6" />
              <span className="sr-only">Theme</span>
            </button>
            <button
              type="button"
              title="Menu"
              className="grid h-12 w-12 cursor-pointer place-items-center rounded-2xl text-[#7d8580] transition hover:bg-white/70 hover:text-[#101513]"
            >
              <Menu aria-hidden className="h-6 w-6" />
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dcf4e7] text-[#1f7a4f]">
                  <Goal aria-hidden className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-normal">
                    LineupComps
                  </p>
                  <p className="text-xs font-medium uppercase tracking-normal text-[#7d8580]">
                    Sports intelligence command center
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <SportTabs activeSport={sport} onSportChange={setSport} />
              <div className="flex gap-2">
                <button
                  type="button"
                  title="Search"
                  className="grid h-12 w-12 cursor-pointer place-items-center rounded-2xl bg-white text-[#202722] shadow-sm transition hover:text-[#1f7a4f]"
                >
                  <Search aria-hidden className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </button>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1f2a24] text-white shadow-sm">
                  <span className="text-xs font-semibold">LC</span>
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.55fr_0.85fr] 2xl:grid-cols-[0.75fr_1.7fr_0.85fr]">
            <div className="grid gap-4">
              <section className="min-h-[540px] rounded-2xl border border-white/80 bg-white/74 p-5 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <CalendarDays aria-hidden className="h-4 w-4" />
                      Match schedule
                    </div>
                    <p className="mt-1 text-xs text-[#69736d]">
                      {useMockData
                        ? "Demo fixtures"
                        : sport === "basketball"
                          ? "Live API-NBA + Basketball feed"
                          : "Live API-SPORTS feed"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${dataMode === "live" ? "bg-[#d7f8df] text-[#0f7a38]" : "bg-[#fff1d8] text-[#9a5a00]"}`}>
                    {dataMode === "live" ? "Live" : "Demo"}
                  </span>
                </div>
                <div className="mt-4">
                  <ScheduleList sport={sport} useMockData={useMockData} compact />
                </div>
              </section>

              <section className="grid grid-cols-2 gap-4">
                <div className="min-h-[190px] rounded-2xl border border-white/80 bg-white/74 p-5 shadow-sm">
                  <Activity aria-hidden className="h-6 w-6 text-[#1f7a4f]" />
                  <p className="mt-6 text-4xl font-semibold tracking-normal">02</p>
                  <p className="text-xs font-medium text-[#69736d]">Sports</p>
                </div>
                <div className="min-h-[190px] rounded-2xl border border-white/80 bg-white/74 p-5 shadow-sm">
                  <Zap aria-hidden className="h-6 w-6 text-[#d97706]" />
                  <p className="mt-6 text-4xl font-semibold tracking-normal">13</p>
                  <p className="text-xs font-medium text-[#69736d]">Tests pass</p>
                </div>
              </section>
            </div>

            <section
              className={`relative min-h-[420px] overflow-hidden rounded-2xl p-4 text-white shadow-sm sm:min-h-[620px] sm:p-5 xl:min-h-[736px] ${
                sport === "football" ? "bg-[#16221a]" : "bg-[#2a1d12]"
              }`}
            >
              {sport === "football" ? <FootballPitch /> : <BasketballCourt />}

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex gap-2">
                  {[Layers3, Shield, Search].map((Icon, index) => (
                    <button
                      key={index}
                      type="button"
                      className="grid h-11 w-11 cursor-pointer place-items-center rounded-2xl bg-black/25 text-white backdrop-blur transition hover:bg-black/35"
                    >
                      <Icon aria-hidden className="h-5 w-5" />
                    </button>
                  ))}
                </div>
                <span className="rounded-full bg-black/28 px-3 py-2 text-xs font-medium backdrop-blur">
                  {featured?.game.league ?? (sport === "football" ? "Football live feed" : "Basketball live feed")}
                </span>
              </div>

              <FeaturedSection
                featured={featured}
                loading={loadingFeatured}
                sport={sport}
                useMockData={useMockData}
              />
            </section>

            <div className="grid gap-4">
              <section className="rounded-2xl border border-white/80 bg-white/74 p-6 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">AI Match Insight</h2>
                    <p className="mt-1 text-sm leading-6 text-[#69736d]">
                      Gemini reads normalized team metrics and writes a
                      non-betting scouting brief.
                    </p>
                  </div>
                  <Sparkles aria-hidden className="h-5 w-5 text-[#d97706]" />
                </div>
                <div className="mt-6 rounded-2xl bg-[#edf1ed] p-4">
                  <p className="text-sm font-medium text-[#1f2a24]">
                    Watch transition control, recent form imbalance, and late
                    game efficiency before calling the matchup.
                  </p>
                </div>
              </section>

              <section className="grid gap-4">
                {quickStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="min-h-[150px] rounded-2xl border border-white/80 bg-white/74 p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[#69736d]">
                        {stat.label}
                      </p>
                      <Gauge aria-hidden className="h-4 w-4 text-[#1f7a4f]" />
                    </div>
                    <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
                    <p className="text-xs text-[#69736d]">{stat.detail}</p>
                  </div>
                ))}
              </section>
            </div>
          </div>

          <section className="mt-4 grid gap-4 md:grid-cols-3">
            {bottomCards.map(([title, detail]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/80 bg-white/74 p-5 shadow-sm"
              >
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[#69736d]">{detail}</p>
              </div>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}

function FeaturedSection({
  featured,
  loading,
  sport,
  useMockData,
}: {
  featured: FeaturedData | null;
  loading: boolean;
  sport: Sport;
  useMockData: boolean;
}) {
  if (loading) {
    return (
      <div className="relative z-10 mt-6 animate-pulse sm:mt-24">
        <div className="max-w-2xl rounded-2xl bg-[#203b2b]/82 p-5 backdrop-blur sm:p-7">
          <div className="h-4 w-40 rounded bg-white/15" />
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="h-8 w-36 rounded bg-white/15" />
            <div className="h-8 w-12 rounded-full bg-white/14" />
            <div className="h-8 w-36 rounded bg-white/15 sm:ml-auto" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="h-16 rounded-xl bg-white/12" />
            <div className="h-16 rounded-xl bg-white/12" />
          </div>
        </div>
      </div>
    );
  }

  if (!featured) {
    return (
      <div className="relative z-10 mt-6 max-w-2xl rounded-2xl bg-[#203b2b]/82 p-5 backdrop-blur sm:mt-24 sm:p-7">
        <p className="text-sm text-white/65">No featured matchup available.</p>
      </div>
    );
  }

  const { game, matchup, players } = featured;
  const homeMetrics = matchup?.home?.metrics;
  const awayMetrics = matchup?.away?.metrics;
  const topHomeMetrics = homeMetrics?.slice(0, 4) ?? [];
  const topAwayMetrics = awayMetrics?.slice(0, 4) ?? [];
  const homePlayers = players?.teams?.home ?? [];
  const awayPlayers = players?.teams?.away ?? [];
  const hasDetails = topHomeMetrics.length > 0 || homePlayers.length > 0;

  return (
    <div className="relative z-10 mt-6 flex flex-col gap-4 sm:mt-14">
      {game.id ? (
        <Link
          href={`/matchup/${game.sport}/${game.id}${useMockData ? "?mock=true" : ""}`}
          className="group block max-w-2xl rounded-2xl bg-[#203b2b]/82 p-5 shadow-2xl backdrop-blur transition hover:bg-[#203b2b]/92 hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)] sm:p-7"
        >
          <FeaturedMatchupCard game={game} sport={sport} />
        </Link>
      ) : (
        <div className="max-w-2xl rounded-2xl bg-[#203b2b]/82 p-5 shadow-2xl backdrop-blur sm:p-7">
          <FeaturedMatchupCard game={game} sport={sport} />
        </div>
      )}

      {hasDetails && (
        <div className="grid gap-3 lg:grid-cols-2">
          {topHomeMetrics.length > 0 && (
            <div className="rounded-2xl bg-black/25 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase text-white/60">
                  {matchup?.metricsSource === "game"
                    ? "Game stats"
                    : matchup?.metricsSource === "live"
                      ? "Live stats"
                      : matchup?.metricsSource === "season"
                        ? "Season avg"
                        : matchup?.metricsSource === "recent"
                          ? "Recent avg"
                          : "Projected"}
                </p>
                <Gauge aria-hidden className="h-3.5 w-3.5 text-white/40" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
                <p className="truncate text-xs font-semibold text-[#b9f4ce]">
                  {game.homeTeam.name}
                </p>
                <p className="truncate text-xs font-semibold text-[#fbbf24]">
                  {game.awayTeam.name}
                </p>
                {topHomeMetrics.map((metric, i) => {
                  const awayMetric = topAwayMetrics[i];
                  return (
                    <MetricRow
                      key={metric.label}
                      label={metric.label}
                      homeValue={metric.displayValue ?? String(metric.value)}
                      awayValue={
                        awayMetric
                          ? (awayMetric.displayValue ?? String(awayMetric.value))
                          : "--"
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          {(homePlayers.length > 0 || awayPlayers.length > 0) && (
            <div className="rounded-2xl bg-black/25 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Users aria-hidden className="h-3.5 w-3.5 text-white/40" />
                  <p className="text-xs font-semibold uppercase text-white/60">
                    Key players
                  </p>
                </div>
                {players?.source && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
                    {players.source}
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <PlayerColumn
                  players={homePlayers.slice(0, 3)}
                  teamName={game.homeTeam.name}
                  color="text-[#b9f4ce]"
                />
                <PlayerColumn
                  players={awayPlayers.slice(0, 3)}
                  teamName={game.awayTeam.name}
                  color="text-[#fbbf24]"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricRow({
  label,
  homeValue,
  awayValue,
}: {
  label: string;
  homeValue: string;
  awayValue: string;
}) {
  return (
    <>
      <div className="flex items-center justify-between rounded-lg bg-white/8 px-2.5 py-1.5">
        <span className="text-[10px] text-white/50">{label}</span>
        <span className="text-sm font-semibold text-white">{homeValue}</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-white/8 px-2.5 py-1.5">
        <span className="text-[10px] text-white/50">{label}</span>
        <span className="text-sm font-semibold text-white">{awayValue}</span>
      </div>
    </>
  );
}

function PlayerColumn({
  players,
  teamName,
  color,
}: {
  players: RosterPlayer[];
  teamName: string;
  color: string;
}) {
  return (
    <div>
      <p className={`truncate text-xs font-semibold ${color}`}>{teamName}</p>
      <div className="mt-2 grid gap-1.5">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-2 rounded-lg bg-white/8 px-2.5 py-1.5"
          >
            <CircleUserRound
              aria-hidden
              className="h-4 w-4 shrink-0 text-white/40"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {player.name}
              </p>
              {player.statLine ? (
                <p className="truncate text-[10px] text-white/45">
                  {player.statLine}
                </p>
              ) : player.position ? (
                <p className="truncate text-[10px] text-white/45">
                  {[player.number ? `#${player.number}` : null, player.position]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        ))}
        {!players.length && (
          <p className="text-[10px] text-white/35">No players available</p>
        )}
      </div>
    </div>
  );
}

function FeaturedMatchupCard({
  game,
  sport,
}: {
  game: ScheduleGame;
  sport: Sport;
}) {
  const seed = `${game.id}:${game.homeTeam.id}:${game.awayTeam.id}`
    .split("")
    .reduce((value, char) => (value * 31 + char.charCodeAt(0)) % 1000, 23);

  const leftLabel =
    sport === "football" ? "Projected xG" : "Scoring signal";
  const leftMetric =
    sport === "football"
      ? `${(1.1 + (seed % 18) / 10).toFixed(1)} xG`
      : `${(76 + (seed % 22)).toFixed(1)} pts`;
  const rightLabel =
    sport === "football" ? "Tempo control" : "Pace index";
  const rightMetric =
    sport === "football"
      ? `${47 + (seed % 19)}% poss.`
      : `${(68 + (seed % 17)).toFixed(1)}`;

  return (
    <>
      <div className="flex items-center gap-2 text-sm font-medium text-[#b9f4ce]">
        <CircleDot aria-hidden className="h-4 w-4 fill-[#34d36f]" />
        Featured live matchup
        {game.status ? (
          <span className="rounded-full bg-white/14 px-2.5 py-1 text-[11px] text-white/80">
            {game.status}
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <TeamLogo logoUrl={game.homeTeam.logoUrl} name={game.homeTeam.name} />
          <p className="truncate text-2xl font-semibold sm:text-3xl">
            {game.homeTeam.name}
          </p>
        </div>
        <span
          className={`w-fit rounded-full bg-white/14 px-3 py-1 font-semibold ${
            game.score ? "text-lg" : "text-xs"
          }`}
        >
          {game.score
            ? `${game.score.home} - ${game.score.away}`
            : "vs"}
        </span>
        <div className="flex min-w-0 items-center gap-3 sm:flex-row-reverse">
          <TeamLogo logoUrl={game.awayTeam.logoUrl} name={game.awayTeam.name} />
          <p className="truncate text-2xl font-semibold sm:text-right sm:text-3xl">
            {game.awayTeam.name}
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/12 p-3">
          <p className="text-xs text-white/65">{leftLabel}</p>
          <p className="mt-1 text-2xl font-semibold">{leftMetric}</p>
        </div>
        <div className="rounded-xl bg-white/12 p-3">
          <p className="text-xs text-white/65">{rightLabel}</p>
          <p className="mt-1 text-2xl font-semibold">{rightMetric}</p>
        </div>
      </div>
    </>
  );
}

function TeamLogo({ logoUrl, name }: { logoUrl?: string; name: string }) {
  if (logoUrl) {
    return (
      <Image
        alt=""
        aria-hidden
        className="h-10 w-10 shrink-0 rounded-full object-contain"
        height={40}
        src={logoUrl}
        width={40}
      />
    );
  }

  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/14 text-xs font-bold text-white">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function FootballPitch() {
  return (
    <>
      <div className="absolute inset-0 [background:linear-gradient(120deg,rgba(31,122,79,.94),rgba(19,61,40,.94)),repeating-linear-gradient(90deg,rgba(255,255,255,.055)_0_1px,transparent_1px_120px)]" />
      <div className="absolute inset-8 rounded-[28px] border-2 border-white/55" />
      <div className="absolute left-1/2 top-8 h-[calc(100%-4rem)] w-px bg-white/45" />
      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
      <div className="absolute left-8 top-[30%] h-[40%] w-[18%] border-2 border-l-0 border-white/45" />
      <div className="absolute right-8 top-[30%] h-[40%] w-[18%] border-2 border-r-0 border-white/45" />
      <div className="absolute left-8 top-[40%] h-[20%] w-[8%] border-2 border-l-0 border-white/40" />
      <div className="absolute right-8 top-[40%] h-[20%] w-[8%] border-2 border-r-0 border-white/40" />
      <div className="absolute left-[44%] top-[43%] h-24 w-40 rounded-2xl bg-[#d7942b]/28 blur-xl" />
    </>
  );
}

function BasketballCourt() {
  return (
    <>
      <div className="absolute inset-0 [background:linear-gradient(120deg,rgba(180,99,30,.94),rgba(92,51,24,.94)),repeating-linear-gradient(90deg,rgba(255,255,255,.07)_0_1px,transparent_1px_110px)]" />
      <div className="absolute inset-8 rounded-[28px] border-2 border-white/55" />
      <div className="absolute left-1/2 top-8 h-[calc(100%-4rem)] w-px bg-white/45" />
      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/45" />
      <div className="absolute left-8 top-[32%] h-[36%] w-[20%] border-2 border-l-0 border-white/45" />
      <div className="absolute right-8 top-[32%] h-[36%] w-[20%] border-2 border-r-0 border-white/45" />
      <div className="absolute left-[18%] top-[36%] h-[28%] w-[22%] rounded-r-full border-2 border-l-0 border-white/35" />
      <div className="absolute right-[18%] top-[36%] h-[28%] w-[22%] rounded-l-full border-2 border-r-0 border-white/35" />
      <div className="absolute left-[44%] top-[43%] h-24 w-40 rounded-2xl bg-[#101513]/24 blur-xl" />
    </>
  );
}

function selectFeaturedGame(games: ScheduleGame[], sport: Sport) {
  if (!games.length) {
    return null;
  }

  return [...games].sort((first, second) => {
    return scoreGame(second, sport) - scoreGame(first, sport);
  })[0];
}

function scoreGame(game: ScheduleGame, sport: Sport) {
  const league = game.league.toLowerCase();
  const teams = `${game.homeTeam.name} ${game.awayTeam.name}`.toLowerCase();
  const status = (game.status ?? "").toLowerCase();
  let score = 0;

  if (!["ft", "finished", "ended"].includes(status)) {
    score += 12;
  }

  const leagueWeights =
    sport === "football"
      ? [
          ["world cup", 30],
          ["champions league", 28],
          ["uefa", 24],
          ["premier league", 22],
          ["la liga", 22],
          ["serie a", 20],
          ["bundesliga", 20],
          ["ligue 1", 18],
          ["mls", 16],
          ["women", 8],
        ]
      : [
          ["nba", 32],
          ["wnba", 28],
          ["euroleague", 22],
          ["ibl", 18],
          ["ncaa", 16],
          ["women", 10],
        ];

  leagueWeights.forEach(([keyword, weight]) => {
    if (league.includes(String(keyword))) {
      score += Number(weight);
    }
  });

  [
    "lakers",
    "celtics",
    "liberty",
    "fever",
    "mystics",
    "real madrid",
    "barcelona",
    "arsenal",
    "manchester",
    "inter",
    "milan",
  ].forEach((keyword) => {
    if (teams.includes(keyword)) {
      score += 10;
    }
  });

  return score;
}
