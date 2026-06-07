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

export async function generateScoutReport(
  matchup: Matchup,
  client: ResponsesClient = createClient(),
): Promise<string> {
  const input = [
    "You are a sports analyst writing a concise scouting report.",
    "Use only the normalized matchup data below.",
    "Do not provide betting advice, odds, wagers, or gambling-style picks.",
    "Cover strengths, weaknesses, key matchup factors, tactical watch points, and a quick game-read summary.",
    "",
    JSON.stringify(matchup, null, 2),
  ].join("\n");

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input,
  });

  return response.output_text?.trim() || "No scouting report was generated.";
}
