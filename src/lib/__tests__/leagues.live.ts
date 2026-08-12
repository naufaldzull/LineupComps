import { describe, expect, it } from "vitest";

import { getLeaguesForSport, type LeagueDef } from "../leagues";

/**
 * Checks the hand-written league ids in `leagues.ts` against the real provider.
 * A wrong id is invisible in the UI — the league page just renders an empty
 * fixture list — so it has to be caught here.
 *
 * Skipped unless APISPORTS_KEY is set, which keeps `npm test` offline. Run it
 * with `npm run verify:leagues`. Costs two upstream calls, not one per league:
 * `/leagues` returns the whole catalogue in a single response.
 */

const apiKey = process.env.APISPORTS_KEY;

type LeagueIndex = Map<string, string>;

const HOSTS = {
  football: "v3.football.api-sports.io",
  basketball: "v1.basketball.api-sports.io",
} as const;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

// Football nests the league under `league`; basketball puts id and name at the
// top level. Read whichever shape came back.
function indexEntry(row: unknown): [string, string] | null {
  const outer = record(row);
  const inner = record(outer.league);
  const id = inner.id ?? outer.id;
  const name = inner.name ?? outer.name;

  if (id === undefined || id === null || typeof name !== "string") {
    return null;
  }

  return [String(id), name];
}

async function fetchLeagueIndex(
  sport: keyof typeof HOSTS,
): Promise<LeagueIndex> {
  const response = await fetch(`https://${HOSTS[sport]}/leagues`, {
    headers: { "x-apisports-key": apiKey! },
  });

  if (!response.ok) {
    throw new Error(`${sport} /leagues returned HTTP ${response.status}`);
  }

  const data = record(await response.json());
  const errors = data.errors;

  if (
    errors &&
    typeof errors === "object" &&
    Object.keys(errors).length > 0
  ) {
    throw new Error(`${sport} /leagues failed: ${JSON.stringify(errors)}`);
  }

  const rows = Array.isArray(data.response) ? data.response : [];
  const index: LeagueIndex = new Map();

  for (const row of rows) {
    const entry = indexEntry(row);

    if (entry) {
      index.set(entry[0], entry[1]);
    }
  }

  if (index.size === 0) {
    throw new Error(`${sport} /leagues returned no leagues`);
  }

  return index;
}

function report(leagues: LeagueDef[], index: LeagueIndex): string[] {
  const missing: string[] = [];

  for (const league of leagues) {
    // The NBA entry is a local sentinel routed to the dedicated NBA API, which
    // has no league catalogue to check against.
    if (league.apiSport === "nba") {
      console.log(`  --  ${league.name} (sentinel, not checked)`);
      continue;
    }

    const upstreamName = index.get(league.id);

    if (!upstreamName) {
      missing.push(`${league.name} (id ${league.id})`);
      console.log(`  XX  ${league.name} -> id ${league.id} NOT FOUND`);
      continue;
    }

    console.log(`  ok  ${league.name} -> id ${league.id} = "${upstreamName}"`);
  }

  return missing;
}

describe.skipIf(!apiKey)("league registry against the live provider", () => {
  it("resolves every football league id", async () => {
    const index = await fetchLeagueIndex("football");
    console.log(`\nFootball (${index.size} leagues upstream):`);

    expect(report(getLeaguesForSport("football"), index)).toEqual([]);
  }, 30_000);

  it("resolves every basketball league id", async () => {
    const index = await fetchLeagueIndex("basketball");
    console.log(`\nBasketball (${index.size} leagues upstream):`);

    expect(report(getLeaguesForSport("basketball"), index)).toEqual([]);
  }, 30_000);
});
