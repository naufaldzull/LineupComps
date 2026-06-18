export type RosterPlayer = {
  id: string;
  name: string;
  number?: string;
  position?: string;
  country?: string;
  statLine?: string;
};

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
