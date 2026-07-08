"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Matchup } from "@/lib/types";

type ComparisonChartsProps = {
  matchup: Matchup;
};

export function ComparisonCharts({ matchup }: ComparisonChartsProps) {
  const panelCopy =
    matchup.metricsSource === "game"
      ? {
          title: "Final Game Stats",
          detail: "Official box score from this completed game.",
          badge: "Box score",
        }
      : matchup.metricsSource === "live"
        ? {
            title: "Live Match Stats",
            detail: "Real-time statistics from the ongoing match.",
            badge: "Live",
          }
        : matchup.metricsSource === "season"
          ? {
              title: "Season Averages",
              detail: "Per-game team performance across the current season.",
              badge: "Season data",
            }
          : matchup.metricsSource === "recent"
            ? {
                title: "Recent Form Averages",
                detail:
                  "Per-game averages from each team's last finished matches.",
                badge: "Recent games",
              }
            : {
                title: "Projected Comparison",
                detail: "Pre-game scouting indicators for this matchup.",
                badge: "Projection",
              };
  const metricLabels = Array.from(
    new Set([
      ...matchup.home.metrics.map((metric) => metric.label),
      ...matchup.away.metrics.map((metric) => metric.label),
    ]),
  );

  const chartData = metricLabels.slice(0, 8).map((label) => {
    const homeMetric = matchup.home.metrics.find((metric) => metric.label === label);
    const awayMetric = matchup.away.metrics.find((metric) => metric.label === label);

    return {
      metric: label,
      home: homeMetric?.value ?? null,
      away: awayMetric?.value ?? null,
    };
  });

  return (
    <section className="rounded-2xl border border-white/80 bg-white/78 p-5 shadow-sm backdrop-blur">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#101513]">
            {panelCopy.title}
          </h2>
          <p className="mt-1 text-sm text-[#69736d]">
            {panelCopy.detail}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="w-fit rounded-full bg-[#16221a] px-3 py-1 text-xs font-semibold text-white">
            {panelCopy.badge}
          </span>
          <span className="w-fit rounded-full bg-[#dcf4e7] px-3 py-1 text-xs font-semibold text-[#1f7a4f]">
            {metricLabels.length} metrics
          </span>
        </div>
      </div>
      <div className="h-96 w-full rounded-2xl bg-[#f8faf7] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 4, right: 14, top: 10 }}>
            <CartesianGrid stroke="#d7ded8" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="metric"
              interval={0}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#52605a", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#52605a", fontSize: 12 }}
              width={38}
            />
            <Tooltip
              contentStyle={{
                border: "1px solid #dfe4df",
                borderRadius: 14,
                boxShadow: "0 12px 32px rgba(30, 42, 36, 0.14)",
              }}
            />
            <Bar
              dataKey="home"
              name={matchup.home.name}
              fill="#1f7a4f"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="away"
              name={matchup.away.name}
              fill="#d97706"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[matchup.home, matchup.away].map((team) => (
          <div key={team.id} className="rounded-2xl bg-[#eef3ef] p-4">
            <p className="truncate text-sm font-semibold text-[#101513]">
              {team.name}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {team.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl bg-white/70 p-3 text-sm"
                >
                  <span className="block text-xs text-[#69736d]">
                    {metric.label}
                  </span>
                  <span className="mt-1 block font-semibold text-[#101513]">
                    {metric.displayValue ?? metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
