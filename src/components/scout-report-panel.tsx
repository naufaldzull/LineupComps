"use client";

import { Brain, Sparkles } from "lucide-react";

import type { Matchup } from "@/lib/types";

type ScoutReportPanelProps = {
  matchup: Matchup;
};

export function ScoutReportPanel({ matchup }: ScoutReportPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Brain aria-hidden className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            AI scouting report
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Generate a matchup brief for {matchup.home.name} vs{" "}
            {matchup.away.name}. The next step wires this panel to OpenAI.
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled
        className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-muted px-4 text-sm font-semibold text-muted-foreground"
      >
        <Sparkles aria-hidden className="h-4 w-4" />
        Generate report
      </button>
    </section>
  );
}
