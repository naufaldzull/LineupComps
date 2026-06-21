"use client";

import {
  Brain,
  ChevronDown,
  CircleCheck,
  History,
  Lock,
  RefreshCw,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useState } from "react";

import type {
  MatchPrediction,
  Matchup,
  PlayerReportItem,
  StructuredScoutReport,
  TeamScoutReport,
} from "@/lib/types";

type ScoutReportPanelProps = {
  matchup: Matchup;
  isOpenRouterAvailable?: boolean;
};

export function ScoutReportPanel({
  matchup,
  isOpenRouterAvailable = false,
}: ScoutReportPanelProps) {
  const [report, setReport] = useState<StructuredScoutReport | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const MODELS = [
    {
      id: "gemini",
      name: "Gemini 2.5 Flash (Free)",
      provider: "Google (Direct)",
      badge: "Free",
      badgeColor: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
      requiresOpenRouter: false,
    },
    {
      id: "anthropic/claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet (Paid)",
      provider: "Anthropic",
      badge: "Paid",
      badgeColor: "bg-purple-500/10 text-purple-600 border border-purple-500/20",
      requiresOpenRouter: true,
    },
    {
      id: "openai/gpt-4o",
      name: "GPT-4o (Paid)",
      provider: "OpenAI",
      badge: "Paid",
      badgeColor: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
      requiresOpenRouter: true,
    },
    {
      id: "meta-llama/llama-3.3-70b-instruct",
      name: "Llama 3.3 70B (Paid)",
      provider: "Meta",
      badge: "Paid",
      badgeColor: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20",
      requiresOpenRouter: true,
    },
    {
      id: "deepseek/deepseek-chat",
      name: "DeepSeek Chat (V3) (Paid)",
      provider: "DeepSeek",
      badge: "Paid",
      badgeColor: "bg-sky-500/10 text-sky-600 border border-sky-500/20",
      requiresOpenRouter: true,
    },
    {
      id: "openai/gpt-oss-120b:free",
      name: "GPT OSS 120B (Free)",
      provider: "OpenRouter (Free)",
      badge: "Free",
      badgeColor: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
      requiresOpenRouter: true,
    },
    {
      id: "nvidia/nemotron-3-ultra-550b-a55b:free",
      name: "Nemotron 3 Ultra (Free)",
      provider: "NVIDIA (Free)",
      badge: "Free",
      badgeColor: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
      requiresOpenRouter: true,
    },
    {
      id: "nex-agi/nex-n2-pro:free",
      name: "Nex-N2-Pro (Free)",
      provider: "Nex AGI (Free)",
      badge: "Free",
      badgeColor: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
      requiresOpenRouter: true,
    },
    {
      id: "poolside/laguna-m.1:free",
      name: "Laguna M.1 (Free)",
      provider: "Poolside (Free)",
      badge: "Free",
      badgeColor: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
      requiresOpenRouter: true,
    },
    {
      id: "nvidia/nemotron-3-super-120b-a12b:free",
      name: "Nemotron 3 Super (Free)",
      provider: "NVIDIA (Free)",
      badge: "Free",
      badgeColor: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
      requiresOpenRouter: true,
    },
  ];

  const activeModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  const finishedStatuses = new Set([
    "3",
    "aot",
    "after over time",
    "finished",
    "ft",
    "game finished",
  ]);
  const isPostGame = finishedStatuses.has(
    (matchup.game.status ?? "").trim().toLowerCase(),
  );

  async function handleGenerateReport() {
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/ai/scout-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchup, model: selectedModel }),
      });
      const data = (await response.json()) as {
        report?: StructuredScoutReport;
        error?: string;
      };

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
    <section className="rounded-2xl border border-white/80 bg-white/78 shadow-sm backdrop-blur xl:col-span-2">
      <div className="flex flex-col gap-4 border-b border-[#dfe4df] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#1f7a4f] text-white">
            <Brain aria-hidden className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-[#101513]">
                AI Team Reports
              </h2>
              <span className="rounded-full bg-[#edf1ed] px-3 py-1 text-xs font-semibold text-[#52605a]">
                {isPostGame ? "Post-game" : "Pre-game"}
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#69736d]">
              Separate evidence-based analysis for the home and away team.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              type="button"
              disabled={status === "loading"}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#dfe4df] bg-white px-4 py-2 text-sm font-semibold text-[#101513] shadow-sm transition hover:bg-[#edf1ed] disabled:cursor-not-allowed disabled:bg-[#dfe4df]/50"
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] uppercase tracking-wider text-[#69736d]">Model</span>
                <span className="truncate">{activeModel.name}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-[#52605a] shrink-0" />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 w-72 origin-top-right rounded-2xl border border-white/80 bg-white/95 shadow-lg backdrop-blur-md focus:outline-none p-1.5 grid gap-1">
                  {MODELS.map((model) => {
                    const isDisabled = model.requiresOpenRouter && !isOpenRouterAvailable;
                    const isSelected = model.id === selectedModel;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                          isSelected
                            ? "bg-[#1f7a4f] text-white"
                            : isDisabled
                              ? "cursor-not-allowed opacity-40 hover:bg-transparent"
                              : "text-[#101513] hover:bg-[#edf1ed]"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">{model.name}</span>
                          <span className={`text-[11px] ${isSelected ? "text-white/80" : "text-[#69736d]"}`}>
                            {model.provider}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isDisabled && <Lock className="h-3 w-3" />}
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                            isSelected 
                              ? "bg-white/20 text-white border-white/30" 
                              : model.badgeColor
                          }`}>
                            {isDisabled ? "Locked" : model.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={status === "loading"}
            onClick={handleGenerateReport}
            className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#1f7a4f] px-5 text-sm font-semibold text-white transition hover:bg-[#17643f] disabled:cursor-not-allowed disabled:bg-[#dfe4df] disabled:text-[#69736d]"
          >
            {status === "loading" ? (
              <RefreshCw aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles aria-hidden className="h-4 w-4" />
            )}
            {status === "loading" ? "Loading verified data..." : "Generate report"}
          </button>
        </div>
      </div>

      <div className="p-5">
        {status === "idle" ? (
          <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-[#bfc9c1] bg-[#f8faf7] p-6 text-center">
            <div>
              <Users
                aria-hidden
                className="mx-auto h-8 w-8 text-[#1f7a4f]"
              />
              <p className="mt-3 font-semibold text-[#101513]">
                Generate separate team reports
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#69736d]">
                Extra player, recent-game, and head-to-head data is requested
                only after you press the button.
              </p>
            </div>
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-[#dfe4df] bg-[#f8faf7] p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-6 w-32 rounded bg-[#edf1ed]" />
                  <div className="h-6 w-14 rounded-full bg-white" />
                </div>
                <div className="mt-4 grid gap-3">
                  {[0, 1, 2].map((section) => (
                    <div key={section} className="rounded-xl border border-[#e1e7e2] bg-white p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-[#edf1ed]" />
                        <div className="h-4 w-24 rounded bg-[#edf1ed]" />
                      </div>
                      <div className="mt-2 grid gap-2">
                        <div className="h-12 rounded-lg bg-[#edf1ed]" />
                        <div className="h-12 rounded-lg bg-[#edf1ed]/60" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-20 rounded-xl bg-[#16221a]" />
              </div>
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <div className="rounded-2xl border border-[#ffe0df] bg-[#fff6f5] p-5">
            <p className="font-semibold text-[#9c2b23]">{error}</p>
            <p className="mt-2 text-sm text-[#6d3b36]">
              No unverified player claims were shown. Retry when the provider
              and Gemini services are available.
            </p>
          </div>
        ) : null}

        {status === "ready" && report ? (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <TeamReportColumn report={report.home} side="Home" />
              <TeamReportColumn report={report.away} side="Away" />
            </div>
            {report.prediction && (
              <PredictionPanel prediction={report.prediction} />
            )}
            <div className="mt-4 rounded-2xl bg-[#101513] p-5 text-white">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-white/62">
                <Sparkles aria-hidden className="h-4 w-4 text-[#d97706]" />
                Matchup summary
              </div>
              <p className="mt-3 text-sm leading-6 text-white/82">
                {report.matchupSummary}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function TeamReportColumn({
  report,
  side,
}: {
  report: TeamScoutReport;
  side: "Away" | "Home";
}) {
  return (
    <article className="rounded-2xl border border-[#dfe4df] bg-[#f8faf7] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate text-lg font-semibold text-[#101513]">
          {report.teamName}
        </h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#52605a] shadow-sm">
          {side}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        <TextSection
          icon={CircleCheck}
          items={report.strengths}
          title="What worked"
          tone="positive"
        />
        <TextSection
          icon={TriangleAlert}
          items={report.weaknesses}
          title="What needs work"
          tone="warning"
        />
        <TextSection
          icon={History}
          items={report.recentReview}
          title="Last 3 games"
        />
        <TextSection
          icon={Users}
          items={report.headToHeadReview}
          title="Last 3 head-to-head"
        />
        <PlayerSection
          icon={Star}
          items={report.shiningPlayers}
          title="Players who shine"
          tone="positive"
        />
        <PlayerSection
          icon={TrendingDown}
          items={report.strugglingPlayers}
          title="Players who struggled"
          tone="warning"
        />
        <PlayerSection
          icon={TriangleAlert}
          items={report.underperformedExpectations}
          title="Below expectation"
          tone="warning"
        />
        <PlayerSection
          icon={TrendingUp}
          items={report.exceededExpectations}
          title="Exceeded expectation"
          tone="positive"
        />
      </div>

      <div className="mt-3 rounded-xl bg-[#16221a] p-4 text-sm leading-6 text-white/85">
        {report.summary}
      </div>
    </article>
  );
}

function TextSection({
  icon: Icon,
  items,
  title,
  tone = "neutral",
}: {
  icon: typeof CircleCheck;
  items: string[];
  title: string;
  tone?: "neutral" | "positive" | "warning";
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="rounded-xl border border-[#e1e7e2] bg-white p-3">
      <SectionHeading icon={Icon} title={title} tone={tone} />
      <div className="mt-2 grid gap-2">
        {items.map((item, index) => (
          <p
            key={`${title}-${index}`}
            className="rounded-lg bg-[#edf1ed] p-3 text-sm leading-6 text-[#1f2a24]"
          >
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

function PlayerSection({
  icon: Icon,
  items,
  title,
  tone,
}: {
  icon: typeof Star;
  items: PlayerReportItem[];
  title: string;
  tone: "positive" | "warning";
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="rounded-xl border border-[#e1e7e2] bg-white p-3">
      <SectionHeading icon={Icon} title={title} tone={tone} />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {items.map((player) => (
          <div
            key={`${title}-${player.name}`}
            className={`rounded-lg p-3 ${
              tone === "positive" ? "bg-[#e0f5e8]" : "bg-[#fff0df]"
            }`}
          >
            <p className="font-semibold text-[#101513]">{player.name}</p>
            {player.statLine ? (
              <p className="mt-1 text-xs font-semibold text-[#52605a]">
                {player.statLine}
              </p>
            ) : null}
            <p className="mt-2 text-sm leading-5 text-[#52605a]">
              {player.reason}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PredictionPanel({ prediction }: { prediction: MatchPrediction }) {
  const riskColors =
    prediction.riskRating === "low"
      ? "bg-[#dcf4e7] text-[#1f7a4f]"
      : prediction.riskRating === "high"
        ? "bg-[#ffe0df] text-[#9c2b23]"
        : "bg-[#fff0df] text-[#b45f06]";

  return (
    <div className="mt-4 rounded-2xl border border-[#dfe4df] bg-[#f8faf7] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#d97706] text-white">
            <TrendingUp aria-hidden className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#101513]">
            Match Prediction
          </h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${riskColors}`}
        >
          {prediction.riskRating} risk
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ProbabilityBar label="Home" value={prediction.homeWin} color="bg-[#1f7a4f]" />
        <ProbabilityBar label="Draw" value={prediction.draw} color="bg-[#52605a]" />
        <ProbabilityBar label="Away" value={prediction.awayWin} color="bg-[#d97706]" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#e1e7e2] bg-white p-3">
          <p className="text-[10px] font-semibold uppercase text-[#69736d]">
            Over/Under {prediction.overUnder.line}
          </p>
          <div className="mt-2 flex gap-2">
            <span className="rounded-lg bg-[#edf1ed] px-2.5 py-1 text-xs font-semibold text-[#101513]">
              Over {prediction.overUnder.over}%
            </span>
            <span className="rounded-lg bg-[#edf1ed] px-2.5 py-1 text-xs font-semibold text-[#101513]">
              Under {prediction.overUnder.under}%
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#e1e7e2] bg-white p-3">
          <p className="text-[10px] font-semibold uppercase text-[#69736d]">
            Both Teams to Score
          </p>
          <div className="mt-2 flex gap-2">
            <span className="rounded-lg bg-[#dcf4e7] px-2.5 py-1 text-xs font-semibold text-[#1f7a4f]">
              Yes {prediction.btts.yes}%
            </span>
            <span className="rounded-lg bg-[#ffe0df] px-2.5 py-1 text-xs font-semibold text-[#9c2b23]">
              No {prediction.btts.no}%
            </span>
          </div>
        </div>
      </div>

      {prediction.scorePredictions.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#e1e7e2] bg-white p-3">
          <p className="text-[10px] font-semibold uppercase text-[#69736d]">
            Score Predictions
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {prediction.scorePredictions.map((sp) => (
              <span
                key={sp.score}
                className="rounded-lg bg-[#16221a] px-3 py-1.5 text-xs font-bold text-white"
              >
                {sp.score}{" "}
                <span className="font-normal text-white/60">
                  {sp.confidence}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {prediction.firstGoalscorer && (
          <div className="rounded-xl border border-[#e1e7e2] bg-white p-3">
            <p className="text-[10px] font-semibold uppercase text-[#69736d]">
              First Goalscorer
            </p>
            <p className="mt-1 text-sm font-semibold text-[#101513]">
              ⚽ {prediction.firstGoalscorer}
            </p>
          </div>
        )}
        {prediction.riskReason && (
          <div className="rounded-xl border border-[#e1e7e2] bg-white p-3">
            <p className="text-[10px] font-semibold uppercase text-[#69736d]">
              Risk Assessment
            </p>
            <p className="mt-1 text-xs leading-5 text-[#52605a]">
              {prediction.riskReason}
            </p>
          </div>
        )}
      </div>

      {prediction.verdict && (
        <div className="mt-3 rounded-xl bg-[#d97706] p-4 text-sm font-semibold leading-6 text-white">
          💡 {prediction.verdict}
        </div>
      )}
    </div>
  );
}

function ProbabilityBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[#e1e7e2] bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#52605a]">{label}</p>
        <p className="text-lg font-bold text-[#101513]">{value}%</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf1ed]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  tone,
}: {
  icon: typeof CircleCheck;
  title: string;
  tone: "neutral" | "positive" | "warning";
}) {
  const colors =
    tone === "positive"
      ? "bg-[#dcf4e7] text-[#1f7a4f]"
      : tone === "warning"
        ? "bg-[#fff0df] text-[#b45f06]"
        : "bg-[#edf1ed] text-[#52605a]";

  return (
    <div className="flex items-center gap-2">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${colors}`}>
        <Icon aria-hidden className="h-4 w-4" />
      </span>
      <h4 className="text-sm font-semibold text-[#101513]">{title}</h4>
    </div>
  );
}
