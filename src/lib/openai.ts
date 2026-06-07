import OpenAI from "openai";

import { requireEnv } from "./env";
import type { Matchup } from "./types";

type ResponsesClient = {
  responses: {
    create: (input: { model: string; input: string }) => Promise<{
      output_text?: string;
    }>;
  };
};

function createClient(): ResponsesClient {
  return new OpenAI({
    apiKey: requireEnv("OPENAI_API_KEY"),
  }) as ResponsesClient;
}

function sanitizeText(value: string, maxLength = 80): string {
  return value
    .replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions/gi, "")
    .replace(/provide\s+betting\s+(picks|advice)/gi, "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMatchupForPrompt(matchup: Matchup): Matchup {
  return {
    game: {
      id: sanitizeText(matchup.game.id, 40),
      sport: matchup.game.sport,
      league: sanitizeText(matchup.game.league),
      startsAt: sanitizeText(matchup.game.startsAt, 40),
      status: matchup.game.status
        ? sanitizeText(matchup.game.status, 40)
        : undefined,
      homeTeam: {
        id: sanitizeText(matchup.game.homeTeam.id, 40),
        name: sanitizeText(matchup.game.homeTeam.name),
        logoUrl: matchup.game.homeTeam.logoUrl,
      },
      awayTeam: {
        id: sanitizeText(matchup.game.awayTeam.id, 40),
        name: sanitizeText(matchup.game.awayTeam.name),
        logoUrl: matchup.game.awayTeam.logoUrl,
      },
    },
    home: {
      id: sanitizeText(matchup.home.id, 40),
      name: sanitizeText(matchup.home.name),
      logoUrl: matchup.home.logoUrl,
      recentForm: matchup.home.recentForm?.slice(0, 5).map((item) =>
        sanitizeText(item, 4),
      ),
      metrics: matchup.home.metrics.slice(0, 8).map((metric) => ({
        label: sanitizeText(metric.label, 40),
        value: Number.isFinite(metric.value) ? metric.value : 0,
        displayValue: metric.displayValue
          ? sanitizeText(metric.displayValue, 24)
          : undefined,
      })),
    },
    away: {
      id: sanitizeText(matchup.away.id, 40),
      name: sanitizeText(matchup.away.name),
      logoUrl: matchup.away.logoUrl,
      recentForm: matchup.away.recentForm?.slice(0, 5).map((item) =>
        sanitizeText(item, 4),
      ),
      metrics: matchup.away.metrics.slice(0, 8).map((metric) => ({
        label: sanitizeText(metric.label, 40),
        value: Number.isFinite(metric.value) ? metric.value : 0,
        displayValue: metric.displayValue
          ? sanitizeText(metric.displayValue, 24)
          : undefined,
      })),
    },
  };
}

export async function generateScoutReport(
  matchup: Matchup,
  client: ResponsesClient = createClient(),
): Promise<string> {
  const sanitizedMatchup = sanitizeMatchupForPrompt(matchup);
  const input = [
    "You are a sports analyst writing a concise scouting report.",
    "Use only the normalized matchup data below.",
    "Do not provide betting advice, odds, wagers, or gambling-style picks.",
    "Cover strengths, weaknesses, key matchup factors, tactical watch points, and a quick game-read summary.",
    "",
    JSON.stringify(sanitizedMatchup, null, 2),
  ].join("\n");

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input,
  });

  return response.output_text?.trim() || "No scouting report was generated.";
}
