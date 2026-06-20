export type RosterPlayer = {
  id: string;
  name: string;
  number?: string;
  position?: string;
  country?: string;
  statLine?: string;
  starter?: boolean;
  subMinute?: number;
  subDirection?: "in" | "out";
  goals?: number;
  assists?: number;
};

export type FootballEventEntry = {
  team?: { id?: number | string };
  type?: string;
  detail?: string;
  time?: { elapsed?: number; extra?: number | null };
  player?: { id?: number | string; name?: string };
  assist?: { id?: number | string; name?: string };
};

export function applySubstitutionEvents(
  players: RosterPlayer[],
  events: FootballEventEntry[],
  teamId: string,
): RosterPlayer[] {
  const teamEvents = events.filter(
    (e) => String(e.team?.id ?? "") === teamId,
  );

  if (!teamEvents.length) return players;

  const subMap = new Map<string, { direction: "in" | "out"; minute: number }>();
  const goalCount = new Map<string, number>();
  const assistCount = new Map<string, number>();

  for (const event of teamEvents) {
    const type = event.type?.toLowerCase() ?? "";

    if (type === "subst") {
      const minute = event.time?.elapsed ?? 0;
      if (event.player?.id) {
        subMap.set(String(event.player.id), { direction: "out", minute });
      }
      if (event.assist?.id) {
        subMap.set(String(event.assist.id), { direction: "in", minute });
      }
    }

    if (type === "goal") {
      if (event.player?.id) {
        const pid = String(event.player.id);
        goalCount.set(pid, (goalCount.get(pid) ?? 0) + 1);
      }
      if (event.assist?.id) {
        const aid = String(event.assist.id);
        assistCount.set(aid, (assistCount.get(aid) ?? 0) + 1);
      }
    }
  }

  return players.map((p) => {
    const sub = subMap.get(p.id);
    const goals = goalCount.get(p.id);
    const playerAssists = assistCount.get(p.id);
    if (!sub && !goals && !playerAssists) return p;
    return {
      ...p,
      ...(sub && { subMinute: sub.minute, subDirection: sub.direction }),
      ...(goals && { goals }),
      ...(playerAssists && { assists: playerAssists }),
    };
  });
}

type FootballLineupEntry = {
  team?: { id?: number | string };
  startXI?: Array<{
    player?: { id?: number | string; name?: string; number?: number; pos?: string };
  }>;
  substitutes?: Array<{
    player?: { id?: number | string; name?: string; number?: number; pos?: string };
  }>;
};

function normalizeFootballPlayers(
  entries: Array<{ player?: { id?: number | string; name?: string; number?: number; pos?: string } }>,
): RosterPlayer[] {
  return entries
    .filter((e) => e.player?.id && e.player?.name)
    .map((e) => ({
      id: String(e.player!.id),
      name: e.player!.name!,
      number: e.player!.number != null ? String(e.player!.number) : undefined,
      position: e.player!.pos ?? undefined,
    }));
}

export function normalizeFootballLineup(
  response: unknown[],
  homeTeamId: string,
  awayTeamId: string,
): { home: RosterPlayer[]; away: RosterPlayer[] } {
  const lineups = response as FootballLineupEntry[];
  let home: RosterPlayer[] = [];
  let away: RosterPlayer[] = [];

  for (const lineup of lineups) {
    const teamId = String(lineup.team?.id ?? "");
    const starters = normalizeFootballPlayers(lineup.startXI ?? []).map(
      (p) => ({ ...p, starter: true }),
    );
    const subs = normalizeFootballPlayers(lineup.substitutes ?? []).map(
      (p) => ({ ...p, starter: false }),
    );

    if (teamId === homeTeamId) {
      home = [...starters, ...subs];
    } else if (teamId === awayTeamId) {
      away = [...starters, ...subs];
    }
  }

  return { home, away };
}

type BasketballRosterRow = {
  id?: number | string;
  name?: string;
  number?: number | string | null;
  position?: string | null;
  country?: string | null;
};

export function normalizeBasketballRoster(
  rows: BasketballRosterRow[],
): RosterPlayer[] {
  const uniquePlayers = new Map<string, RosterPlayer>();

  rows.forEach((row) => {
    const id = row.id === undefined ? "" : String(row.id);
    const name = row.name?.trim() ?? "";

    if (!id || !name || uniquePlayers.has(id)) {
      return;
    }

    uniquePlayers.set(id, {
      id,
      name,
      number:
        row.number === null || row.number === undefined
          ? undefined
          : String(row.number),
      position: row.position?.trim() || undefined,
      country: row.country?.trim() || undefined,
    });
  });

  return [...uniquePlayers.values()]
    .sort((first, second) => {
      const firstDetails = [first.number, first.position, first.country].filter(
        Boolean,
      ).length;
      const secondDetails = [
        second.number,
        second.position,
        second.country,
      ].filter(Boolean).length;

      return secondDetails - firstDetails || first.name.localeCompare(second.name);
    })
    .slice(0, 6);
}
