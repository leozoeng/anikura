export type DeskRangePreset = 1 | 7 | 15 | 30;

export type DeskRange =
  | { kind: "preset"; days: DeskRangePreset }
  | { kind: "day"; date: string };

export const DESK_RANGE_PRESETS: Array<{ days: DeskRangePreset; label: string }> =
  [
    { days: 1, label: "1d" },
    { days: 7, label: "7d" },
    { days: 15, label: "15d" },
    { days: 30, label: "30d" },
  ];

export function deskRangeKey(range: DeskRange): string {
  return range.kind === "preset" ? `p${range.days}` : `d${range.date}`;
}

export function deskRangeLabel(range: DeskRange): string {
  if (range.kind === "day") {
    return formatDeskDay(range.date);
  }
  if (range.days === 1) return "Today";
  return `Last ${range.days} days`;
}

export function formatDeskDay(isoDay: string): string {
  const d = new Date(`${isoDay}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDay;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function utcTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function lastNDaysKeys(n: number, endKey = utcTodayKey()): string[] {
  const end = new Date(`${endKey}T12:00:00Z`);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export function sliceByDeskRange<T extends { day: string }>(
  rows: T[],
  range: DeskRange,
): T[] {
  if (range.kind === "day") {
    const hit = rows.find((r) => r.day === range.date);
    return hit ? [hit] : [];
  }
  return rows.slice(-range.days);
}

/** Prior window of equal length immediately before the selected range. */
export function slicePriorDeskRange<T extends { day: string }>(
  rows: T[],
  range: DeskRange,
): T[] {
  if (rows.length === 0) return [];

  if (range.kind === "day") {
    const idx = rows.findIndex((r) => r.day === range.date);
    if (idx <= 0) return [];
    return [rows[idx - 1]!];
  }

  if (range.days === 1) {
    // Today → yesterday
    if (rows.length < 2) return [];
    return [rows[rows.length - 2]!];
  }

  const end = rows.length - range.days;
  if (end <= 0) return [];
  return rows.slice(Math.max(0, end - range.days), end);
}

export function priorDeskRangeLabel(range: DeskRange): string {
  if (range.kind === "day" || range.days === 1) return "vs yesterday";
  return `vs prior ${range.days}d`;
}

export function sumField<T>(arr: T[], pick: (row: T) => number) {
  return arr.reduce((s, row) => s + pick(row), 0);
}
