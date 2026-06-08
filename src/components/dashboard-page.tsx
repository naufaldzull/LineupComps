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
import { useMemo, useState } from "react";

import { ScheduleList } from "@/components/schedule-list";
import { SportTabs } from "@/components/sport-tabs";
import type { Sport } from "@/lib/types";

type DashboardPageProps = {
  useMockData: boolean;
};

const navItems = [
  { label: "Home", icon: Home, active: true },
  { label: "Fixtures", icon: CalendarDays },
  { label: "Analytics", icon: BarChart3 },
  { label: "Reports", icon: Brain },
  { label: "Alerts", icon: Bell },
];

const quickStats = [
  { label: "Model confidence", value: "87%", detail: "Gemini scouting" },
  { label: "Live mode", value: "Ready", detail: "mock=false support" },
  { label: "Tracked sports", value: "02", detail: "Football / Basketball" },
];

export function DashboardPage({ useMockData }: DashboardPageProps) {
  const [sport, setSport] = useState<Sport>("football");

  const matchup = useMemo(
    () =>
      sport === "football"
        ? {
            home: "Arsenal",
            away: "Manchester City",
            league: "Premier League",
            leftMetric: "2.1 xG",
            rightMetric: "61% poss.",
          }
        : {
            home: "Boston Celtics",
            away: "Los Angeles Lakers",
            league: "NBA",
            leftMetric: "118.2 pts",
            rightMetric: "39.1% 3PT",
          },
    [sport],
  );

  return (
    <main className="min-h-screen bg-[#e9ecea] p-3 text-[#101513] sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl grid-cols-1 overflow-hidden rounded-[22px] border border-white/80 bg-[#f4f5f2]/90 shadow-[0_24px_80px_rgba(30,42,36,0.14)] lg:grid-cols-[72px_1fr]">
        <aside className="hidden border-r border-[#dfe4df] bg-[#ebecea] px-3 py-5 lg:flex lg:flex-col lg:items-center lg:justify-between">
          <div className="grid gap-6">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#1f7a4f] shadow-sm">
              <Trophy aria-hidden className="h-5 w-5" />
            </div>
            <nav className="grid gap-3">
              {navItems.map(({ label, icon: Icon, active }) => (
                <button
                  key={label}
                  type="button"
                  title={label}
                  className={`grid h-11 w-11 cursor-pointer place-items-center rounded-2xl transition ${
                    active
                      ? "bg-white text-[#1f7a4f] shadow-sm"
                      : "text-[#7d8580] hover:bg-white/70 hover:text-[#101513]"
                  }`}
                >
                  <Icon aria-hidden className="h-5 w-5" />
                  <span className="sr-only">{label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="grid gap-3">
            <button
              type="button"
              title="Theme"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-2xl text-[#7d8580] transition hover:bg-white/70 hover:text-[#101513]"
            >
              <Moon aria-hidden className="h-5 w-5" />
              <span className="sr-only">Theme</span>
            </button>
            <button
              type="button"
              title="Menu"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-2xl text-[#7d8580] transition hover:bg-white/70 hover:text-[#101513]"
            >
              <Menu aria-hidden className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-4 sm:px-6 lg:px-7">
          <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dcf4e7] text-[#1f7a4f]">
                  <Goal aria-hidden className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-normal">
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
                  className="grid h-11 w-11 cursor-pointer place-items-center rounded-2xl bg-white text-[#202722] shadow-sm transition hover:text-[#1f7a4f]"
                >
                  <Search aria-hidden className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </button>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1f2a24] text-white shadow-sm">
                  <span className="text-xs font-semibold">LC</span>
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-3 xl:grid-cols-[0.72fr_1.28fr_0.8fr]">
            <div className="grid gap-3">
              <section className="rounded-2xl border border-white/80 bg-white/74 p-4 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <CalendarDays aria-hidden className="h-4 w-4" />
                      Match schedule
                    </div>
                    <p className="mt-1 text-xs text-[#69736d]">
                      {useMockData ? "Demo fixtures" : "Live API-SPORTS feed"}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#dcf4e7] px-3 py-1 text-xs font-semibold text-[#1f7a4f]">
                    Active
                  </span>
                </div>
                <div className="mt-4">
                  <ScheduleList sport={sport} useMockData={useMockData} compact />
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/80 bg-white/74 p-4 shadow-sm">
                  <Activity aria-hidden className="h-5 w-5 text-[#1f7a4f]" />
                  <p className="mt-4 text-3xl font-semibold tracking-normal">02</p>
                  <p className="text-xs font-medium text-[#69736d]">Sports</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/74 p-4 shadow-sm">
                  <Zap aria-hidden className="h-5 w-5 text-[#d97706]" />
                  <p className="mt-4 text-3xl font-semibold tracking-normal">13</p>
                  <p className="text-xs font-medium text-[#69736d]">Tests pass</p>
                </div>
              </section>
            </div>

            <section className="relative min-h-[440px] overflow-hidden rounded-2xl bg-[#16221a] p-4 text-white shadow-sm">
              <div className="absolute inset-0 opacity-90 [background:linear-gradient(120deg,rgba(31,122,79,.92),rgba(25,56,39,.88)),repeating-linear-gradient(90deg,rgba(255,255,255,.06)_0_1px,transparent_1px_84px),repeating-linear-gradient(0deg,rgba(255,255,255,.05)_0_1px,transparent_1px_70px)]" />
              <div className="absolute left-[9%] top-[15%] h-[68%] w-[82%] rotate-[-10deg] rounded-xl border-2 border-white/55" />
              <div className="absolute left-[34%] top-[10%] h-[78%] w-px rotate-[-10deg] bg-white/45" />
              <div className="absolute left-[58%] top-[9%] h-[78%] w-px rotate-[-10deg] bg-white/35" />
              <div className="absolute left-[38%] top-[33%] h-28 w-44 rounded-2xl bg-[#d7942b]/35 blur-sm" />
              <div className="absolute bottom-5 right-5 h-24 w-28 rounded-2xl border border-white/50 bg-white/10 backdrop-blur" />

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

              <div className="relative z-10 mt-24 max-w-md rounded-2xl bg-[#203b2b]/82 p-5 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-medium text-[#b9f4ce]">
                  <CircleDot aria-hidden className="h-4 w-4 fill-[#34d36f]" />
                  Featured matchup
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <p className="truncate text-2xl font-semibold">{matchup.home}</p>
                  <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold">
                    vs
                  </span>
                  <p className="truncate text-2xl font-semibold sm:text-right">
                    {matchup.away}
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/12 p-3">
                    <p className="text-xs text-white/65">Home edge</p>
                    <p className="mt-1 text-xl font-semibold">{matchup.leftMetric}</p>
                  </div>
                  <div className="rounded-xl bg-white/12 p-3">
                    <p className="text-xs text-white/65">Away signal</p>
                    <p className="mt-1 text-xl font-semibold">{matchup.rightMetric}</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-3">
              <section className="rounded-2xl border border-white/80 bg-white/74 p-5 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">AI Match Insight</h2>
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

              <section className="grid gap-3">
                {quickStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/80 bg-white/74 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[#69736d]">
                        {stat.label}
                      </p>
                      <Gauge aria-hidden className="h-4 w-4 text-[#1f7a4f]" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
                    <p className="text-xs text-[#69736d]">{stat.detail}</p>
                  </div>
                ))}
              </section>
            </div>
          </div>

          <section className="mt-3 grid gap-3 md:grid-cols-3">
            {[
              ["Scout report", "Generate tactical strengths and weaknesses."],
              ["API-SPORTS", "Free tier friendly with mock fallback."],
              ["Portfolio ready", "Data dense, visual, and demo safe."],
            ].map(([title, detail]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/80 bg-white/74 p-4 shadow-sm"
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
