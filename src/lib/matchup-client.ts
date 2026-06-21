import type { Matchup, Sport } from "./types";

type MatchupResponse = {
  matchup?: Matchup;
  isOpenRouterAvailable?: boolean;
  error?: string;
};

type MatchupRequest = {
  sport: Sport;
  gameId: string;
  mock: boolean;
};

export async function fetchMatchup(
  request: MatchupRequest,
  fetcher: typeof fetch = fetch,
): Promise<{ matchup: Matchup; isOpenRouterAvailable: boolean }> {
  const query = new URLSearchParams({
    sport: request.sport,
    gameId: request.gameId,
    mock: String(request.mock),
  });
  const response = await fetcher(`/api/sports/matchup?${query.toString()}`, {
    cache: "no-store",
  });
  const data = (await response.json()) as MatchupResponse;

  if (!response.ok || !data.matchup) {
    throw new Error(data.error ?? "Matchup unavailable");
  }

  return {
    matchup: data.matchup,
    isOpenRouterAvailable: Boolean(data.isOpenRouterAvailable),
  };
}
