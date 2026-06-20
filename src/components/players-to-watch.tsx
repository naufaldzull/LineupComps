"use client";

import {
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
  label: string;
  players: RosterPlayer[];
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

function groupByPosition(players: RosterPlayer[]): PositionGroup[] {
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

  return [...groups.entries()]
    .sort(
      ([a], [b]) =>
        (POSITION_ORDER[a] ?? 99) - (POSITION_ORDER[b] ?? 99),
    )
    .map(([pos, players]) => ({
      label: positionGroupLabel(pos),
      players,
    }));
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
            <FootballLineup
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

function FootballLineup({
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
  const homeStarters = useMemo(
    () => homePlayers.filter((p) => p.starter !== false),
    [homePlayers],
  );
  const homeSubs = useMemo(
    () => homePlayers.filter((p) => p.starter === false),
    [homePlayers],
  );
  const awayStarters = useMemo(
    () => awayPlayers.filter((p) => p.starter !== false),
    [awayPlayers],
  );
  const awaySubs = useMemo(
    () => awayPlayers.filter((p) => p.starter === false),
    [awayPlayers],
  );

  const homeGroups = useMemo(() => groupByPosition(homeStarters), [homeStarters]);
  const awayGroups = useMemo(() => groupByPosition(awayStarters), [awayStarters]);

  return (
    <div className="mt-5 grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#52605a]">
          Starting XI
        </p>
        <div className="mt-3 grid gap-5 lg:grid-cols-2">
          <PositionGroupedTeam name={homeName} label="Home" groups={homeGroups} />
          <PositionGroupedTeam name={awayName} label="Away" groups={awayGroups} />
        </div>
      </div>

      {(homeSubs.length > 0 || awaySubs.length > 0) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#52605a]">
            Substitutes
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-2">
            <SubsList name={homeName} label="Home" players={homeSubs} />
            <SubsList name={awayName} label="Away" players={awaySubs} />
          </div>
        </div>
      )}
    </div>
  );
}

function PositionGroupedTeam({
  name,
  label,
  groups,
}: {
  name: string;
  label: string;
  groups: PositionGroup[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="truncate text-sm font-semibold text-[#101513]">
          {name}
        </h3>
        <span className="text-[11px] font-semibold uppercase text-[#69736d]">
          {label}
        </span>
      </div>
      {groups.length ? (
        <div className="grid gap-2.5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#1f7a4f]">
                {group.label}
              </p>
              <div className="grid gap-1">
                {group.players.map((player) => (
                  <PlayerCard key={player.id} player={player} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-[#edf1ed] p-3 text-xs text-[#69736d]">
          Lineup not yet available.
        </p>
      )}
    </div>
  );
}

function SubsList({
  name,
  label,
  players,
}: {
  name: string;
  label: string;
  players: RosterPlayer[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="truncate text-sm font-semibold text-[#101513]">
          {name}
        </h3>
        <span className="text-[11px] font-semibold uppercase text-[#69736d]">
          {label}
        </span>
      </div>
      {players.length ? (
        <div className="grid gap-1">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} compact />
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-[#edf1ed] p-3 text-xs text-[#69736d]">
          No substitutes listed.
        </p>
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
