"use client";

import {
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { RosterPlayer } from "@/lib/player-roster";
import type { Matchup } from "@/lib/types";

type PlayersResponse = {
  source?: string;
  season?: string;
  teams?: {
    home: RosterPlayer[];
    away: RosterPlayer[];
  };
  error?: string;
};

type PositionGroup = {
  key: string;
  label: string;
  home: RosterPlayer[];
  away: RosterPlayer[];
};

const POSITION_ORDER: Record<string, number> = {
  G: 0,
  D: 1,
  M: 2,
  F: 3,
};

function positionGroupLabel(pos: string): string {
  switch (pos) {
    case "G":
      return "Goalkeeper";
    case "D":
      return "Defenders";
    case "M":
      return "Midfielders";
    case "F":
      return "Forwards";
    default:
      return "Other";
  }
}

function splitByPosition(players: RosterPlayer[]): Map<string, RosterPlayer[]> {
  const groups = new Map<string, RosterPlayer[]>();
  for (const player of players) {
    const pos = player.position ?? "?";
    const existing = groups.get(pos);
    if (existing) {
      existing.push(player);
    } else {
      groups.set(pos, [player]);
    }
  }
  return groups;
}

function buildPages(
  homePlayers: RosterPlayer[],
  awayPlayers: RosterPlayer[],
): PositionGroup[] {
  const homeStarters = homePlayers.filter((p) => p.starter !== false);
  const homeSubs = homePlayers.filter((p) => p.starter === false);
  const awayStarters = awayPlayers.filter((p) => p.starter !== false);
  const awaySubs = awayPlayers.filter((p) => p.starter === false);

  const homeByPos = splitByPosition(homeStarters);
  const awayByPos = splitByPosition(awayStarters);

  const allPositions = new Set([...homeByPos.keys(), ...awayByPos.keys()]);
  const sorted = [...allPositions].sort(
    (a, b) => (POSITION_ORDER[a] ?? 99) - (POSITION_ORDER[b] ?? 99),
  );

  const pages: PositionGroup[] = [];

  // Group GK + DEF together
  const defPositions = sorted.filter((p) => p === "G" || p === "D");
  if (defPositions.length) {
    pages.push({
      key: "def",
      label: "Goalkeeper & Defenders",
      home: defPositions.flatMap((p) => homeByPos.get(p) ?? []),
      away: defPositions.flatMap((p) => awayByPos.get(p) ?? []),
    });
  }

  // MID
  const midPlayers = sorted.filter((p) => p === "M");
  if (midPlayers.length) {
    pages.push({
      key: "mid",
      label: "Midfielders",
      home: homeByPos.get("M") ?? [],
      away: awayByPos.get("M") ?? [],
    });
  }

  // FWD
  const fwdPlayers = sorted.filter((p) => p === "F");
  if (fwdPlayers.length) {
    pages.push({
      key: "fwd",
      label: "Forwards",
      home: homeByPos.get("F") ?? [],
      away: awayByPos.get("F") ?? [],
    });
  }

  // Others
  const others = sorted.filter(
    (p) => !["G", "D", "M", "F"].includes(p),
  );
  if (others.length) {
    pages.push({
      key: "other",
      label: "Other",
      home: others.flatMap((p) => homeByPos.get(p) ?? []),
      away: others.flatMap((p) => awayByPos.get(p) ?? []),
    });
  }

  // Subs
  if (homeSubs.length || awaySubs.length) {
    pages.push({
      key: "subs",
      label: "Substitutes",
      home: homeSubs,
      away: awaySubs,
    });
  }

  return pages;
}

function playerDetail(player: RosterPlayer): string {
  if (player.statLine) {
    return player.statLine;
  }

  return (
    [
      player.number ? `#${player.number}` : null,
      player.position,
      player.country,
    ]
      .filter(Boolean)
      .join(" · ") || "Roster player"
  );
}

export function PlayersToWatch({ matchup }: { matchup: Matchup }) {
  const [data, setData] = useState<PlayersResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const isFootball = matchup.game.sport === "football";

  useEffect(() => {
    let mounted = true;

    async function loadPlayers() {
      setStatus("loading");

      try {
        const query = new URLSearchParams({
          sport: matchup.game.sport,
          gameId: matchup.game.id,
          homeTeamId: matchup.home.id,
          awayTeamId: matchup.away.id,
          startsAt: matchup.game.startsAt,
          league: matchup.game.league,
        });
        const response = await fetch(`/api/sports/players?${query.toString()}`);
        const payload = (await response.json()) as PlayersResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Player data unavailable");
        }

        if (mounted) {
          setData(payload);
          setStatus("ready");
        }
      } catch {
        if (mounted) {
          setStatus("error");
        }
      }
    }

    void loadPlayers();

    return () => {
      mounted = false;
    };
  }, [matchup]);

  return (
    <aside className="rounded-2xl border border-white/80 bg-white/78 p-5 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <UsersRound aria-hidden className="h-5 w-5 text-[#1f7a4f]" />
            <h2 className="text-xl font-semibold text-[#101513]">
              {isFootball ? "Match Lineup" : "Players to Watch"}
            </h2>
          </div>
          <p className="mt-1 text-sm leading-6 text-[#69736d]">
            {isFootball
              ? "Starting XI and substitutes from API-SPORTS."
              : "Player names supplied by API-SPORTS."}
          </p>
        </div>
      </div>

      {status === "loading" ? (
        <div className="mt-5 grid gap-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-14 animate-pulse rounded-xl bg-[#edf1ed]"
            />
          ))}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-5 rounded-xl bg-[#fff0df] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#9a5a00]">
            <ShieldAlert aria-hidden className="h-4 w-4" />
            Player data unavailable
          </div>
          <p className="mt-2 text-xs leading-5 text-[#6f5a3b]">
            {isFootball
              ? "Lineups may not be available until close to kickoff."
              : "The current provider plan did not return a usable roster."}
          </p>
        </div>
      ) : null}

      {status === "ready" && data?.teams ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#16221a] px-3 py-1 text-[11px] font-semibold text-white">
              {data.source ?? "Roster"}
            </span>
            <span className="rounded-full bg-[#dcf4e7] px-3 py-1 text-[11px] font-semibold text-[#1f7a4f]">
              {data.season}
            </span>
          </div>
          {isFootball ? (
            <FootballLineupPaginated
              homeName={matchup.home.name}
              awayName={matchup.away.name}
              homePlayers={data.teams.home}
              awayPlayers={data.teams.away}
            />
          ) : (
            <div className="mt-5 grid gap-5">
              <PlayerTeam
                label="Home"
                name={matchup.home.name}
                players={data.teams.home}
              />
              <PlayerTeam
                label="Away"
                name={matchup.away.name}
                players={data.teams.away}
              />
            </div>
          )}
        </>
      ) : null}
    </aside>
  );
}

function FootballLineupPaginated({
  homeName,
  awayName,
  homePlayers,
  awayPlayers,
}: {
  homeName: string;
  awayName: string;
  homePlayers: RosterPlayer[];
  awayPlayers: RosterPlayer[];
}) {
  const pages = useMemo(
    () => buildPages(homePlayers, awayPlayers),
    [homePlayers, awayPlayers],
  );
  const [page, setPage] = useState(0);
  const current = pages[page];

  if (!pages.length) {
    return (
      <p className="mt-5 rounded-xl bg-[#edf1ed] p-3 text-xs text-[#69736d]">
        Lineup not yet available.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2 rounded-xl bg-[#edf1ed] p-1.5">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-white text-[#1f7a4f] shadow-sm transition hover:bg-[#dcf4e7] disabled:cursor-not-allowed disabled:text-[#a8b1ab] disabled:shadow-none"
        >
          <ChevronLeft aria-hidden className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          {pages.map((p, i) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPage(i)}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                i === page
                  ? "bg-[#1f7a4f] text-white"
                  : "text-[#52605a] hover:bg-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={page >= pages.length - 1}
          onClick={() => setPage((p) => p + 1)}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-white text-[#1f7a4f] shadow-sm transition hover:bg-[#dcf4e7] disabled:cursor-not-allowed disabled:text-[#a8b1ab] disabled:shadow-none"
        >
          <ChevronRight aria-hidden className="h-4 w-4" />
        </button>
      </div>

      {current && (
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="truncate text-sm font-semibold text-[#101513]">
                {homeName}
              </h3>
              <span className="text-[11px] font-semibold uppercase text-[#69736d]">
                Home
              </span>
            </div>
            <div className="grid gap-1">
              {current.home.length ? (
                current.home.map((p) => (
                  <PlayerCard key={p.id} player={p} compact />
                ))
              ) : (
                <p className="rounded-xl bg-[#edf1ed] p-3 text-xs text-[#69736d]">
                  No players in this group.
                </p>
              )}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="truncate text-sm font-semibold text-[#101513]">
                {awayName}
              </h3>
              <span className="text-[11px] font-semibold uppercase text-[#69736d]">
                Away
              </span>
            </div>
            <div className="grid gap-1">
              {current.away.length ? (
                current.away.map((p) => (
                  <PlayerCard key={p.id} player={p} compact />
                ))
              ) : (
                <p className="rounded-xl bg-[#edf1ed] p-3 text-xs text-[#69736d]">
                  No players in this group.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerTeam({
  label,
  name,
  players,
}: {
  label: string;
  name: string;
  players: RosterPlayer[];
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate text-sm font-semibold text-[#101513]">
          {name}
        </h3>
        <span className="text-[11px] font-semibold uppercase text-[#69736d]">
          {label}
        </span>
      </div>
      <div className="mt-2 grid gap-2">
        {players.length ? (
          players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))
        ) : (
          <p className="rounded-xl bg-[#edf1ed] p-3 text-xs text-[#69736d]">
            No player names returned.
          </p>
        )}
      </div>
    </section>
  );
}

function PlayerCard({
  player,
  compact = false,
}: {
  player: RosterPlayer;
  compact?: boolean;
}) {
  const subTag =
    player.subDirection === "out"
      ? { label: `↓ ${player.subMinute}'`, color: "bg-[#ffe0df] text-[#9c2b23]" }
      : player.subDirection === "in"
        ? { label: `↑ ${player.subMinute}'`, color: "bg-[#d7f8df] text-[#0f7a38]" }
        : null;

  return (
    <div
      className={`flex min-w-0 items-center gap-2.5 rounded-xl ${
        player.subDirection === "out" ? "bg-[#edf1ed]/60" : "bg-[#edf1ed]"
      } ${compact ? "px-3 py-2" : "p-3"}`}
    >
      <span
        className={`grid shrink-0 place-items-center rounded-lg bg-white text-[#1f7a4f] ${
          compact ? "h-7 w-7" : "h-9 w-9"
        }`}
      >
        {player.number ? (
          <span className={`font-bold ${compact ? "text-[10px]" : "text-xs"}`}>
            {player.number}
          </span>
        ) : (
          <CircleUserRound
            aria-hidden
            className={compact ? "h-3.5 w-3.5" : "h-5 w-5"}
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className={`truncate font-semibold ${
              player.subDirection === "out"
                ? "text-[#69736d]"
                : "text-[#101513]"
            } ${compact ? "text-xs" : "text-sm"}`}
          >
            {player.name}
          </p>
          {player.goals
            ? Array.from({ length: player.goals }, (_, i) => (
                <span key={`g${i}`} className="shrink-0 text-[11px]" title="Goal">
                  ⚽
                </span>
              ))
            : null}
          {player.assists
            ? Array.from({ length: player.assists }, (_, i) => (
                <span key={`a${i}`} className="shrink-0 text-[10px]" title="Assist">
                  👟
                </span>
              ))
            : null}
          {subTag && (
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${subTag.color}`}
            >
              {subTag.label}
            </span>
          )}
        </div>
        {!compact && (
          <p className="mt-0.5 truncate text-xs text-[#69736d]">
            {playerDetail(player)}
          </p>
        )}
      </div>
    </div>
  );
}
