import { requireEnv } from "./env";
import type { Sport } from "./types";

const BASE_URLS: Record<Sport, string> = {
  football: "https://v3.football.api-sports.io",
  basketball: "https://v1.basketball.api-sports.io",
};

export async function apiSportsGet<T>(
  sport: Sport,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${BASE_URLS[sport]}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: { "x-apisports-key": requireEnv("APISPORTS_KEY") },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`API-SPORTS request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
