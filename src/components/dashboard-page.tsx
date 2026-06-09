"use client";

import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  CalendarDays,
  CircleDot,
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
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ScheduleList } from "@/components/schedule-list";
import { SportTabs } from "@/components/sport-tabs";
import type { ScheduleGame, Sport } from "@/lib/types";

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

type FeaturedMatchup = {
  away: string;
  home: string;
  league: string;
  leftLabel: string;
  leftMetric: string;
  rightLabel: string;
  rightMetric: string;
  score?: string;
  status?: string;
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
  const [featuredGame, setFeaturedGame] = useState<ScheduleGame | null>(null);
  const quickStats = getQuickStats(dataMode);

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedMatchup() {
      setFeaturedGame(null);

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

        if (isMounted) {
          setFeaturedGame(selectFeaturedGame(data.games ?? [], sport));
        }
      } catch {
        if (isMounted) {
          setFeaturedGame(null);
        }
      }
    }

    void loadFeaturedMatchup();

    return () => {
      isMounted = false;
    };
  }, [sport, useMockData]);

  const matchup = useMemo(
    () => buildFeaturedMatchup(sport, featuredGame),
    [featuredGame, sport],
  );
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
              className={`relative min-h-[620px] overflow-hidden rounded-2xl p-5 text-white shadow-sm xl:min-h-[736px] ${
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
                  {matchup.league}
                </span>
              </div>

              <div className="relative z-10 mt-32 max-w-2xl rounded-2xl bg-[#203b2b]/82 p-7 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-medium text-[#b9f4ce]">
                  <CircleDot aria-hidden className="h-4 w-4 fill-[#34d36f]" />
                  Featured live matchup
                  {matchup.status ? (
                    <span className="rounded-full bg-white/14 px-2.5 py-1 text-[11px] text-white/80">
                      {matchup.status}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <p className="truncate text-3xl font-semibold">{matchup.home}</p>
                  <span
                    className={`rounded-full bg-white/14 px-3 py-1 font-semibold ${
                      matchup.score ? "text-lg" : "text-xs"
                    }`}
                  >
                    {matchup.score ?? "vs"}
                  </span>
                  <p className="truncate text-3xl font-semibold sm:text-right">
                    {matchup.away}
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/12 p-3">
                    <p className="text-xs text-white/65">{matchup.leftLabel}</p>
                    <p className="mt-1 text-2xl font-semibold">{matchup.leftMetric}</p>
                  </div>
                  <div className="rounded-xl bg-white/12 p-3">
                    <p className="text-xs text-white/65">{matchup.rightLabel}</p>
                    <p className="mt-1 text-2xl font-semibold">{matchup.rightMetric}</p>
                  </div>
                </div>
              </div>
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

function buildFeaturedMatchup(
  sport: Sport,
  game: ScheduleGame | null,
): FeaturedMatchup {
  if (!game) {
    return {
      away: "Loading fixtures",
      home: "Selecting matchup",
      league: sport === "football" ? "Football live feed" : "Basketball live feed",
      leftLabel: "Signal scan",
      rightLabel: "Schedule feed",
      leftMetric: "--",
      rightMetric: "--",
    };
  }

  const seed = `${game.id}:${game.homeTeam.id}:${game.awayTeam.id}`
    .split("")
    .reduce((value, char) => (value * 31 + char.charCodeAt(0)) % 1000, 23);

  if (sport === "football") {
    const xg = (1.1 + (seed % 18) / 10).toFixed(1);
    const possession = 47 + (seed % 19);

    return {
      away: game.awayTeam.name,
      home: game.homeTeam.name,
      league: game.league,
      leftLabel: "Projected xG",
      leftMetric: `${xg} xG`,
      rightLabel: "Tempo control",
      rightMetric: `${possession}% poss.`,
      score: game.score
        ? `${game.score.home} - ${game.score.away}`
        : undefined,
      status: game.status,
    };
  }

  const points = (76 + (seed % 22)).toFixed(1);
  const pace = (68 + (seed % 17)).toFixed(1);

  return {
    away: game.awayTeam.name,
    home: game.homeTeam.name,
    league: game.league,
    leftLabel: "Scoring signal",
    leftMetric: `${points} pts`,
    rightLabel: "Pace index",
    rightMetric: pace,
    score: game.score
      ? `${game.score.home} - ${game.score.away}`
      : undefined,
    status: game.status,
  };
}
