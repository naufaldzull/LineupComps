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
  const chartData = matchup.home.metrics.map((homeMetric) => {
    const awayMetric = matchup.away.metrics.find(
      (metric) => metric.label === homeMetric.label,
    );

    return {
      metric: homeMetric.label,
      home: homeMetric.value,
      away: awayMetric?.value ?? 0,
    };
  });

  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          Key metric comparison
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Side-by-side indicators for the selected matchup.
        </p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 0, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="metric" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={36} />
            <Tooltip />
            <Bar
              dataKey="home"
              name={matchup.home.name}
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="away"
              name={matchup.away.name}
              fill="hsl(var(--accent))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[matchup.home, matchup.away].map((team) => (
          <div key={team.id} className="rounded-lg bg-background p-4">
            <p className="text-sm font-semibold text-foreground">{team.name}</p>
            <div className="mt-3 grid gap-2">
              {team.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-semibold text-foreground">
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
