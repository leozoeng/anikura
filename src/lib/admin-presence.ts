/** Presence helpers for Night desk live table. */

export function formatSessionDuration(
  firstSeen: string | null | undefined,
  lastSeen: string | null | undefined,
  nowMs = Date.now(),
): { label: string; seconds: number | null; source: "session" | "none" } {
  const startRaw = firstSeen || null;
  if (!startRaw) {
    return { label: "—", seconds: null, source: "none" };
  }
  const start = new Date(startRaw).getTime();
  if (Number.isNaN(start)) {
    return { label: "—", seconds: null, source: "none" };
  }
  // Live desk: tick from first heartbeat to now. Fall back to last_seen if clock skew.
  const last = lastSeen ? new Date(lastSeen).getTime() : NaN;
  const end = Number.isNaN(last) ? nowMs : Math.max(nowMs, last);
  const seconds = Math.max(0, Math.round((end - start) / 1000));
  return { label: formatDurationShort(seconds), seconds, source: "session" };
}

export function formatDurationShort(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) {
    const rem = s % 60;
    return rem > 0 && m < 10 ? `${m}m ${rem}s` : `${m}m`;
  }
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h < 24) return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return remH > 0 ? `${d}d ${remH}h` : `${d}d`;
}

export function formatLastSeenRelative(
  lastSeen: string,
  nowMs = Date.now(),
): string {
  const t = new Date(lastSeen).getTime();
  if (Number.isNaN(t)) return "—";
  const delta = Math.max(0, Math.round((nowMs - t) / 1000));
  if (delta < 8) return "just now";
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  return new Date(lastSeen).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type WatchingInfo = {
  label: string;
  meta: string;
  path: string;
  isWatching: boolean;
};

export function watchingFromPath(
  path: string | null | undefined,
  resolve?: (path: string) => { label: string; meta: string } | null,
): WatchingInfo {
  const raw = (path ?? "/").trim() || "/";
  const clean = raw.split("?")[0] || "/";
  const resolved = resolve?.(clean);
  if (resolved) {
    return {
      label: resolved.label,
      meta: resolved.meta,
      path: clean,
      isWatching: resolved.meta === "Watching",
    };
  }

  const watch = clean.match(/^\/watch\/(\d+)(?:\/([^/?#]*))?/);
  if (watch) {
    const slug = watch[2];
    const title = slug
      ? decodeURIComponent(slug)
          .replace(/[-_]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : `Anime #${watch[1]}`;
    return {
      label: title,
      meta: "Watching",
      path: clean,
      isWatching: true,
    };
  }

  return {
    label: clean,
    meta: "Path",
    path: clean,
    isWatching: false,
  };
}
