import { requireEnv } from "./env";
import type { Matchup } from "./types";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type GeminiClient = {
  generateContent: (input: string) => Promise<string>;
};

const GEMINI_MODEL = "gemini-2.5-flash";

function createClient(): GeminiClient {
  return {
    async generateContent(input: string) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": requireEnv("GEMINI_API_KEY"),
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: input }],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini request failed: ${response.status}`);
      }

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim();

      return text || "No scouting report was generated.";
    },
  };
}

function sanitizeText(value: unknown, maxLength = 80): string {
  return String(value)
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
      },
      awayTeam: {
        id: sanitizeText(matchup.game.awayTeam.id, 40),
        name: sanitizeText(matchup.game.awayTeam.name),
      },
    },
    home: {
      id: sanitizeText(matchup.home.id, 40),
      name: sanitizeText(matchup.home.name),
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
  client: GeminiClient = createClient(),
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

  return client.generateContent(input);
}
