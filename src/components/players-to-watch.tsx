"use client";

import { CircleUserRound, ShieldAlert, UsersRound } from "lucide-react";
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
              className="h-16 animate-pulse rounded-xl bg-[#edf1ed]"
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
          <div className="mt-5 grid gap-5">
            {isFootball ? (
              <>
                <FootballTeamLineup
                  label="Home"
                  name={matchup.home.name}
                  players={data.teams.home}
                />
                <FootballTeamLineup
                  label="Away"
                  name={matchup.away.name}
                  players={data.teams.away}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </>
      ) : null}
    </aside>
  );
}

function FootballTeamLineup({
  label,
  name,
  players,
}: {
  label: string;
  name: string;
  players: RosterPlayer[];
}) {
  const groups = useMemo(() => groupByPosition(players), [players]);

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
      {groups.length ? (
        <div className="mt-3 grid gap-3">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#1f7a4f]">
                {group.label}
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {group.players.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-[#edf1ed] p-3 text-xs text-[#69736d]">
          Lineup not yet available.
        </p>
      )}
    </section>
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

function PlayerCard({ player }: { player: RosterPlayer }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-[#edf1ed] p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#1f7a4f]">
        {player.number ? (
          <span className="text-xs font-bold">{player.number}</span>
        ) : (
          <CircleUserRound aria-hidden className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#101513]">
          {player.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-[#69736d]">
          {playerDetail(player)}
        </p>
      </div>
    </div>
  );
}
