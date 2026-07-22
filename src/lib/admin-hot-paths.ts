import type { CatalogAnime } from "@/lib/types";

const STATIC_LABELS: Record<string, string> = {
  "/": "Home",
  "/browse": "Browse",
  "/search": "Search",
  "/genres": "Genres",
  "/ghibli": "Studio Ghibli",
  "/one-piece": "One Piece",
  "/shinkai": "Makoto Shinkai",
  "/login": "Login",
  "/profile": "Profile",
  "/social": "Social",
};

export type HotPageRow = {
  path: string;
  views: number;
};

export type HotWatchRow = {
  path: string;
  seconds: number;
  sessions: number;
};

export type HotListItem = {
  path: string;
  label: string;
  meta: string;
  href: string;
  value: number;
  valueLabel: string;
};

function prettifySlug(slug: string) {
  try {
    return decodeURIComponent(slug)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return slug;
  }
}

function matchAnime(
  path: string,
  byId: Map<number, CatalogAnime>,
): { anime: CatalogAnime | null; kind: "watch" | "anime" | null; id: number | null } {
  const watch = path.match(/^\/watch\/(\d+)(?:\/([^/?#]*))?/);
  if (watch) {
    const id = Number(watch[1]);
    return { anime: byId.get(id) ?? null, kind: "watch", id };
  }
  const anime = path.match(/^\/anime\/(\d+)(?:\/([^/?#]*))?/);
  if (anime) {
    const id = Number(anime[1]);
    return { anime: byId.get(id) ?? null, kind: "anime", id };
  }
  return { anime: null, kind: null, id: null };
}

export function labelAdminPath(
  path: string,
  byId: Map<number, CatalogAnime>,
): { label: string; meta: string; href: string } {
  const clean = path.split("?")[0] || "/";
  const matched = matchAnime(clean, byId);
  if (matched.kind) {
    const slugPart = clean.split("/")[3];
    const fallback =
      (slugPart ? prettifySlug(slugPart) : null) ||
      (matched.id != null ? `Anime #${matched.id}` : "Anime");
    return {
      label: matched.anime?.title ?? fallback,
      meta: matched.kind === "watch" ? "Watching" : "Title page",
      href: clean,
    };
  }

  if (clean.startsWith("/genres/")) {
    const slug = clean.slice("/genres/".length).split("/")[0] ?? "";
    return {
      label: prettifySlug(slug || "genre"),
      meta: "Genre",
      href: clean,
    };
  }

  if (clean.startsWith("/u/")) {
    return { label: "Member profile", meta: "Profile", href: clean };
  }

  const staticLabel = STATIC_LABELS[clean];
  if (staticLabel) {
    return { label: staticLabel, meta: "Page", href: clean };
  }

  return {
    label: clean.length > 42 ? `${clean.slice(0, 40)}…` : clean,
    meta: "Page",
    href: clean,
  };
}

export function enrichHotPages(
  rows: HotPageRow[],
  catalog: CatalogAnime[],
): HotListItem[] {
  const byId = new Map(catalog.map((a) => [a.id, a]));
  return rows.map((row) => {
    const labeled = labelAdminPath(row.path, byId);
    return {
      path: row.path,
      label: labeled.label,
      meta: labeled.meta,
      href: labeled.href,
      value: row.views,
      valueLabel: `${row.views} view${row.views === 1 ? "" : "s"}`,
    };
  });
}

export function enrichHotWatched(
  rows: HotWatchRow[],
  catalog: CatalogAnime[],
): HotListItem[] {
  const byId = new Map(catalog.map((a) => [a.id, a]));
  return rows.map((row) => {
    const labeled = labelAdminPath(row.path, byId);
    const hours = row.seconds / 3600;
    const valueLabel =
      hours < 0.1
        ? `${Math.round(row.seconds / 60)}m`
        : `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
    const sessionBit =
      row.sessions > 0
        ? ` · ${row.sessions} session${row.sessions === 1 ? "" : "s"}`
        : "";
    return {
      path: row.path,
      label: labeled.label,
      meta: `Watched today${sessionBit}`,
      href: labeled.href,
      value: row.seconds,
      valueLabel,
    };
  });
}
