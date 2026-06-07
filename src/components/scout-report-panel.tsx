"use client";

import { Brain, Sparkles } from "lucide-react";
import { useState } from "react";

import type { Matchup } from "@/lib/types";

type ScoutReportPanelProps = {
  matchup: Matchup;
};

export function ScoutReportPanel({ matchup }: ScoutReportPanelProps) {
  const [report, setReport] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function handleGenerateReport() {
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/ai/scout-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchup }),
      });
      const data = (await response.json()) as { report?: string; error?: string };

      if (!response.ok || !data.report) {
        throw new Error(data.error ?? "Report unavailable");
      }

      setReport(data.report);
      setStatus("ready");
    } catch (reportError) {
      setError(
        reportError instanceof Error ? reportError.message : "Report unavailable",
      );
      setStatus("error");
    }
  }

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
            {matchup.away.name}.
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={status === "loading"}
        onClick={handleGenerateReport}
        className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        <Sparkles aria-hidden className="h-4 w-4" />
        {status === "loading" ? "Generating..." : "Generate report"}
      </button>
      {status === "error" && (
        <div className="mt-4 rounded-lg bg-background p-4 text-sm text-muted-foreground">
          {error}
        </div>
      )}
      {status === "ready" && (
        <div className="mt-4 whitespace-pre-wrap rounded-lg bg-background p-4 text-sm leading-6 text-foreground">
          {report}
        </div>
      )}
    </section>
  );
}
