import { describe, expect, it } from "vitest";

import { getLeaguesForSport, type LeagueDef } from "../leagues";
import type { Sport } from "../types";

/**
 * Checks the hand-written league ids in `leagues.ts` against the real provider.
 * A wrong id is invisible in the UI — the league page just renders an empty
 * fixture list — so it has to be caught here.
 *
 * Existence alone is not enough: id 116 resolves fine but is NCAA, not the WNBA.
 * So each id is pinned to the exact name and country the provider reports, and
 * any drift fails. Provider names often differ from our display names (WNBA is
 * filed as "NBA W"), which is why the expected values live here rather than
 * being derived from `LeagueDef.name`.
 *
 * Skipped unless APISPORTS_KEY is set, which keeps `npm test` offline. Run it
 * with `npm run verify:leagues`. Costs two upstream calls, not one per league:
 * `/leagues` returns the whole catalogue in a single response.
 */

const apiKey = process.env.APISPORTS_KEY;

/** `${sport}:${id}` -> `${upstream name}|${upstream country}` */
const EXPECTED: Record<string, string> = {
  "football:1": "World Cup|World",
  "football:2": "UEFA Champions League|World",
  "football:3": "UEFA Europa League|World",
  "football:39": "Premier League|England",
  "football:140": "La Liga|Spain",
  "football:135": "Serie A|Italy",
  "football:78": "Bundesliga|Germany",
  "football:61": "Ligue 1|France",
  "football:94": "Primeira Liga|Portugal",
  "football:88": "Eredivisie|Netherlands",
  "football:253": "Major League Soccer|USA",
  "football:307": "Pro League|Saudi-Arabia",
  "football:71": "Serie A|Brazil",
  "basketball:13": "NBA W|USA",
};

type UpstreamLeague = { name: string; country: string };
type LeagueIndex = Map<string, UpstreamLeague>;

const HOSTS: Record<Sport, string> = {
  football: "v3.football.api-sports.io",
  basketball: "v1.basketball.api-sports.io",
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

// Football nests the league under `league`; basketball puts id and name at the
// top level. Read whichever shape came back.
function indexEntry(row: unknown): [string, UpstreamLeague] | null {
  const outer = record(row);
  const inner = record(outer.league);
  const id = inner.id ?? outer.id;
  const name = inner.name ?? outer.name;
  const country = record(outer.country).name;

  if (id === undefined || id === null || typeof name !== "string") {
    return null;
  }

  return [
    String(id),
    { name, country: typeof country === "string" ? country : "?" },
  ];
}

async function fetchLeagueIndex(sport: Sport): Promise<LeagueIndex> {
  const response = await fetch(`https://${HOSTS[sport]}/leagues`, {
    headers: { "x-apisports-key": apiKey! },
  });

  if (!response.ok) {
    throw new Error(`${sport} /leagues returned HTTP ${response.status}`);
  }

  const data = record(await response.json());
  const errors = data.errors;

  if (errors && typeof errors === "object" && Object.keys(errors).length > 0) {
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

function report(
  sport: Sport,
  leagues: LeagueDef[],
  index: LeagueIndex,
): string[] {
  const problems: string[] = [];

  for (const league of leagues) {
    // The NBA entry is a local sentinel routed to the dedicated NBA API, which
    // has no league catalogue to check against.
    if (league.apiSport === "nba") {
      console.log(`  --  ${league.name} (sentinel, not checked)`);
      continue;
    }

    const key = `${sport}:${league.id}`;
    const expected = EXPECTED[key];
    const upstream = index.get(league.id);

    if (!expected) {
      problems.push(`${league.name}: no expected value pinned for ${key}`);
      console.log(`  ??  ${league.name} -> id ${league.id} NOT PINNED`);
      continue;
    }

    if (!upstream) {
      problems.push(`${league.name}: id ${league.id} does not exist upstream`);
      console.log(`  XX  ${league.name} -> id ${league.id} NOT FOUND`);
      continue;
    }

    const actual = `${upstream.name}|${upstream.country}`;

    if (actual !== expected) {
      problems.push(
        `${league.name}: id ${league.id} is "${actual}", expected "${expected}"`,
      );
      console.log(
        `  XX  ${league.name} -> id ${league.id} is "${actual}", expected "${expected}"`,
      );
      continue;
    }

    console.log(
      `  ok  ${league.name} -> id ${league.id} = "${upstream.name}" (${upstream.country})`,
    );
  }

  return problems;
}

describe.skipIf(!apiKey)("league registry against the live provider", () => {
  it("resolves every football league id", async () => {
    const index = await fetchLeagueIndex("football");
    console.log(`\nFootball (${index.size} leagues upstream):`);

    expect(report("football", getLeaguesForSport("football"), index)).toEqual(
      [],
    );
  }, 30_000);

  it("resolves every basketball league id", async () => {
    const index = await fetchLeagueIndex("basketball");
    console.log(`\nBasketball (${index.size} leagues upstream):`);

    expect(
      report("basketball", getLeaguesForSport("basketball"), index),
    ).toEqual([]);
  }, 30_000);
});
