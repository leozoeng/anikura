import {
  getAniListRelationGraphs,
  type AniListMedia,
  type AniListRelationNode,
  type AniListTitle,
} from "@/lib/anilist";
import type { CatalogAnime } from "@/lib/types";

export type CatalogMatch = {
  id: number;
  slug: string;
  poster: string;
  title: string;
};

export type RelatedMediaCard = {
  media: {
    id: number;
    title: AniListTitle;
    coverImage?: { large?: string | null } | null;
    seasonYear?: number | null;
    format?: string | null;
  };
  match: CatalogMatch;
};

export type RelatedEntry = RelatedMediaCard & {
  relationType: string;
  relationLabel: string;
};

const RELATED_TYPES = new Set([
  "PREQUEL",
  "SEQUEL",
  "SIDE_STORY",
  "SPIN_OFF",
  "PARENT",
  "SUMMARY",
  "ALTERNATIVE",
  "COMPILATION",
  "OTHER",
  "CONTAINS",
]);

const SEASON_TYPES = new Set(["PREQUEL", "SEQUEL"]);

const RELATION_LABELS: Record<string, string> = {
  PREQUEL: "Prequel",
  SEQUEL: "Sequel",
  SIDE_STORY: "Side story",
  SPIN_OFF: "Spin-off",
  PARENT: "Parent story",
  SUMMARY: "Summary",
  ALTERNATIVE: "Alternative",
  COMPILATION: "Compilation",
  OTHER: "Related",
  CONTAINS: "Contains",
};

const FORMAT_LABELS: Record<string, string> = {
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  TV_SHORT: "Short",
  MUSIC: "Music",
};

export function relationLabel(type?: string | null, format?: string | null) {
  const base =
    RELATION_LABELS[type || ""] ||
    (type
      ? type
          .toLowerCase()
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "Related");
  const formatLabel = FORMAT_LABELS[format || ""];
  if (formatLabel && !base.toLowerCase().includes(formatLabel.toLowerCase())) {
    return `${base} · ${formatLabel}`;
  }
  return base;
}

export function buildAniIdIndex(catalog: CatalogAnime[]) {
  const byAniId = new Map<number, CatalogAnime>();
  for (const item of catalog) {
    const n = Number(item.ani_id);
    if (n) byAniId.set(n, item);
  }
  return byAniId;
}

export function buildMalIdIndex(catalog: CatalogAnime[]) {
  const byMalId = new Map<number, CatalogAnime>();
  for (const item of catalog) {
    const n = Number(item.mal_id);
    if (n) byMalId.set(n, item);
  }
  return byMalId;
}

/**
 * Only exact AniList / MAL id matches — never fuzzy titles.
 * Title matching was sending users to the wrong anime page.
 */
function findCatalogMatch(
  media: { id: number; idMal?: number | null },
  byAniId: Map<number, CatalogAnime>,
  byMalId: Map<number, CatalogAnime>,
): CatalogAnime | null {
  const byAni = byAniId.get(media.id);
  if (byAni) return byAni;

  const mal = Number(media.idMal);
  if (mal) {
    const byMal = byMalId.get(mal);
    if (byMal) return byMal;
  }

  return null;
}

function toMatch(item: CatalogAnime): CatalogMatch {
  return {
    id: item.id,
    slug: item.slug,
    poster: item.poster,
    title: item.title,
  };
}

/** Keep card art/title aligned with the catalog page the link opens. */
function cardFromMatch(
  match: CatalogAnime,
  media?: {
    id?: number;
    title?: AniListTitle;
    coverImage?: { large?: string | null } | null;
    seasonYear?: number | null;
    format?: string | null;
  },
): RelatedMediaCard {
  return {
    media: {
      id: Number(match.ani_id) || media?.id || match.id,
      title: {
        english: match.title,
        romaji: media?.title?.romaji || match.title,
        native: match.native || media?.title?.native,
      },
      coverImage: { large: match.poster || media?.coverImage?.large || null },
      seasonYear: match.year ?? media?.seasonYear ?? null,
      format: media?.format ?? match.terms_by_type?.type?.[0] ?? null,
    },
    match: toMatch(match),
  };
}

export type SeasonEntry = RelatedEntry & {
  isCurrent?: boolean;
  /** Chronological / title-derived season number for TV installments; 0 for movies. */
  seasonIndex: number;
  /** Display badge, e.g. "Season 2", "Season 1 · Part 2", "Movie". */
  seasonLabel: string;
};

function entryTitle(entry: RelatedMediaCard) {
  return (
    entry.media.title.english ||
    entry.media.title.romaji ||
    entry.match.title ||
    ""
  );
}

function franchiseStem(title: string) {
  return title
    .toLowerCase()
    .split(/[:：]/)[0]
    .replace(/\b(\d+)(st|nd|rd|th)?\s*season\b/gi, " ")
    .replace(/\bseason\s*\d+\b/gi, " ")
    .replace(/\b(part|cour|arc|movie|film|ova|oad|special|the movie)\b.*$/gi, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stemsMatch(a: string, b: string) {
  if (!a || !b || a.length < 5 || b.length < 5) return false;
  return a === b || a.startsWith(b) || b.startsWith(a);
}

function normalizeTitleKey(title: string) {
  return title
    .toLowerCase()
    .replace(/\b(\d+)(st|nd|rd|th)?\s*season\b/gi, "season $1")
    .replace(/\bseason\s*0*(\d+)\b/gi, "season $1")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pull explicit "Season 2" / "2nd Season" / "Part 2" from titles.
 * Part/cour alone is not a season number (Spy x Family Part 2 ≠ Season 2).
 */
function parseTitleSeason(title: string): {
  season: number | null;
  part: number | null;
} {
  const seasonMatch =
    title.match(/\b(\d+)(?:st|nd|rd|th)\s*season\b/i) ||
    title.match(/\bseason\s*0*(\d+)\b/i);
  const partMatch = title.match(/\b(?:part|cour)\s*0*(\d+)\b/i);
  return {
    season: seasonMatch ? Number(seasonMatch[1]) : null,
    part: partMatch ? Number(partMatch[1]) : null,
  };
}

/** Formats that belong in the Seasons strip (not OVA/special noise). */
function isSeasonStripFormat(format?: string | null, title = "") {
  const f = (format || "TV").toUpperCase();
  if (f === "TV" || f === "TV_SHORT" || f === "MOVIE") return true;
  // Keep numbered ONA seasons; skip mini-anime shorts.
  if (f === "ONA") {
    const parsed = parseTitleSeason(title);
    return parsed.season != null || parsed.part != null;
  }
  return false;
}

function catalogFormat(item: CatalogAnime, mediaFormat?: string | null) {
  return (
    mediaFormat ||
    item.terms_by_type?.type?.[0] ||
    "TV"
  );
}

function findCatalogSiblings(
  current: CatalogAnime,
  catalog: CatalogAnime[],
): CatalogAnime[] {
  const stem = franchiseStem(current.title);
  if (stem.length < 5) return [];
  return catalog.filter((item) => {
    if (item.id === current.id) return false;
    const other = franchiseStem(item.title);
    const alt = item.alternative ? franchiseStem(item.alternative) : "";
    return stemsMatch(stem, other) || (alt.length >= 5 && stemsMatch(stem, alt));
  });
}

/**
 * Assign Season / Part / Movie labels from title cues + chronological order.
 * Avoids treating specials/OVAs as Season 1 and Part 2 cours as a new season.
 */
function labelFranchiseSeasons(entries: RelatedEntry[]): SeasonEntry[] {
  const strip = entries.filter((e) =>
    isSeasonStripFormat(e.media.format, entryTitle(e)),
  );

  strip.sort((a, b) => {
    const ya = a.media.seasonYear;
    const yb = b.media.seasonYear;
    const yearA = ya && ya > 0 ? ya : 9999;
    const yearB = yb && yb > 0 ? yb : 9999;
    if (yearA !== yearB) return yearA - yearB;

    // Movies sit after TV cours in the same year.
    const aMovie = (a.media.format || "").toUpperCase() === "MOVIE" ? 1 : 0;
    const bMovie = (b.media.format || "").toUpperCase() === "MOVIE" ? 1 : 0;
    if (aMovie !== bMovie) return aMovie - bMovie;

    const pa = parseTitleSeason(entryTitle(a));
    const pb = parseTitleSeason(entryTitle(b));
    const sa = pa.season ?? 0;
    const sb = pb.season ?? 0;
    if (sa !== sb) return sa - sb;
    const partA = pa.part ?? 0;
    const partB = pb.part ?? 0;
    if (partA !== partB) return partA - partB;

    return a.match.id - b.match.id;
  });

  let autoSeason = 0;
  let lastTvSeason = 0;

  return strip.map((entry) => {
    const title = entryTitle(entry);
    const format = (entry.media.format || "TV").toUpperCase();
    const parsed = parseTitleSeason(title);
    const isCurrent = entry.relationType === "CURRENT";

    if (format === "MOVIE") {
      return {
        ...entry,
        seasonIndex: 0,
        seasonLabel: "Movie",
        isCurrent,
        relationLabel: isCurrent ? "Movie · Current" : "Movie",
      };
    }

    let seasonIndex: number;
    let seasonLabel: string;

    if (parsed.season != null) {
      seasonIndex = parsed.season;
      lastTvSeason = parsed.season;
      autoSeason = Math.max(autoSeason, parsed.season);
      seasonLabel =
        parsed.part != null && parsed.part > 1
          ? `Season ${parsed.season} · Part ${parsed.part}`
          : `Season ${parsed.season}`;
    } else if (parsed.part != null) {
      // Cour continuation of the prior (or first) season.
      seasonIndex = lastTvSeason > 0 ? lastTvSeason : 1;
      if (lastTvSeason === 0) {
        lastTvSeason = 1;
        autoSeason = Math.max(autoSeason, 1);
      }
      seasonLabel = `Season ${seasonIndex} · Part ${parsed.part}`;
    } else {
      autoSeason += 1;
      seasonIndex = autoSeason;
      lastTvSeason = autoSeason;
      seasonLabel = `Season ${autoSeason}`;
    }

    return {
      ...entry,
      seasonIndex,
      seasonLabel,
      isCurrent,
      relationLabel: isCurrent ? `${seasonLabel} · Current` : seasonLabel,
    };
  });
}

type FranchiseHit = {
  node: AniListRelationNode;
  relationType: "PREQUEL" | "SEQUEL";
};

/**
 * Full season list for the more-info / watch pages:
 * AniList prequel/sequel walk + catalog title siblings, including the current season.
 * Labels use title season/part cues (not raw list index) and skip OVA/special noise.
 */
export async function resolveFranchiseSeasons(
  anilist: AniListMedia | null | undefined,
  catalog: CatalogAnime[],
  current: CatalogAnime,
): Promise<SeasonEntry[]> {
  const byAniId = buildAniIdIndex(catalog);
  const byMalId = buildMalIdIndex(catalog);
  const hits = new Map<number, FranchiseHit>();

  if (anilist?.id) {
    const fetched = new Set<number>();
    const directionOf = new Map<number, "PREQUEL" | "SEQUEL" | "ROOT">([
      [anilist.id, "ROOT"],
    ]);

    const absorbEdge = (
      fromDir: "PREQUEL" | "SEQUEL" | "ROOT",
      type: string,
      node: AniListRelationNode,
    ) => {
      if (node.type !== "ANIME") return;
      if (!SEASON_TYPES.has(type)) return;
      if (node.id === anilist.id) return;
      if (fromDir === "PREQUEL" && type !== "PREQUEL") return;
      if (fromDir === "SEQUEL" && type !== "SEQUEL") return;

      const dir = type as "PREQUEL" | "SEQUEL";
      if (!hits.has(node.id)) {
        hits.set(node.id, { node, relationType: dir });
        directionOf.set(node.id, dir);
      }
    };

    for (const edge of anilist.relations?.edges ?? []) {
      if (edge.node && edge.relationType) {
        absorbEdge("ROOT", edge.relationType, edge.node);
      }
    }
    fetched.add(anilist.id);

    let guard = 0;
    while (guard < 10) {
      guard += 1;
      const pending = [...hits.keys()].filter((id) => !fetched.has(id));
      if (!pending.length) break;

      const batchIds = pending.slice(0, 50);
      for (const id of batchIds) fetched.add(id);

      const graphs = await getAniListRelationGraphs(batchIds);
      for (const media of graphs) {
        const fromDir = directionOf.get(media.id) || "ROOT";
        for (const edge of media.relations?.edges ?? []) {
          if (edge.node && edge.relationType) {
            absorbEdge(fromDir, edge.relationType, edge.node);
          }
        }
      }
    }
  }

  const byCatalogId = new Map<number, RelatedEntry>();
  const seenAniIds = new Set<number>();
  const seenTitleKeys = new Set<string>();

  const tryAdd = (entry: RelatedEntry) => {
    if (byCatalogId.has(entry.match.id)) return;
    const ani = entry.media.id;
    if (ani && seenAniIds.has(ani)) return;
    const key = normalizeTitleKey(entryTitle(entry));
    if (key.length >= 8 && seenTitleKeys.has(key)) return;

    // Drop OVA / special / music noise from the seasons strip.
    if (!isSeasonStripFormat(entry.media.format, entryTitle(entry))) return;

    byCatalogId.set(entry.match.id, entry);
    if (ani) seenAniIds.add(ani);
    if (key.length >= 8) seenTitleKeys.add(key);
  };

  for (const { node, relationType } of hits.values()) {
    const match = findCatalogMatch(node, byAniId, byMalId);
    if (!match || match.id === current.id) continue;
    const card = cardFromMatch(match, {
      ...node,
      format: catalogFormat(match, node.format),
    });
    tryAdd({
      ...card,
      relationType,
      relationLabel:
        relationType === "PREQUEL" ? "Earlier season" : "Later season",
    });
  }

  // Catalog siblings (covers missing ani_ids / incomplete AniList links).
  for (const sibling of findCatalogSiblings(current, catalog)) {
    const year = sibling.year ?? 0;
    const curYear = current.year ?? anilist?.seasonYear ?? 0;
    const relationType = year && curYear && year < curYear ? "PREQUEL" : "SEQUEL";
    tryAdd({
      ...cardFromMatch(sibling, {
        format: catalogFormat(sibling),
        seasonYear: sibling.year,
      }),
      relationType,
      relationLabel:
        relationType === "PREQUEL" ? "Earlier season" : "Later season",
    });
  }

  // Always include the current title so the full series strip is visible.
  const currentCard: RelatedEntry = {
    ...cardFromMatch(current, anilist
      ? {
          id: anilist.id,
          title: anilist.title,
          coverImage: anilist.coverImage,
          seasonYear: anilist.seasonYear,
          format: catalogFormat(current, anilist.format),
        }
      : { format: catalogFormat(current) }),
    relationType: "CURRENT",
    relationLabel: "Current",
  };
  byCatalogId.set(current.id, currentCard);
  if (currentCard.media.id) seenAniIds.add(currentCard.media.id);
  const currentKey = normalizeTitleKey(entryTitle(currentCard));
  if (currentKey.length >= 8) seenTitleKeys.add(currentKey);

  const labeled = labelFranchiseSeasons([...byCatalogId.values()]);

  // Need at least current + one other to show a seasons strip.
  if (labeled.length < 2) return [];

  return labeled.map((entry) => ({
    ...entry,
    isCurrent: entry.match.id === current.id,
    relationLabel:
      entry.match.id === current.id
        ? `${entry.seasonLabel} · Current`
        : entry.seasonLabel,
  }));
}

export function buildRelatedEntries(
  anilist: AniListMedia | null | undefined,
  catalog: CatalogAnime[],
  byAniId = buildAniIdIndex(catalog),
  byMalId = buildMalIdIndex(catalog),
  options?: { excludeCatalogIds?: Iterable<number> },
): RelatedEntry[] {
  const edges = anilist?.relations?.edges ?? [];
  const seen = new Set<number>(options?.excludeCatalogIds ?? []);
  const out: RelatedEntry[] = [];

  for (const edge of edges) {
    const node = edge.node;
    if (!node || node.type !== "ANIME") continue;
    const type = edge.relationType || "OTHER";
    // TV/movie seasons live in resolveFranchiseSeasons; keep OVA/special
    // prequel/sequel edges here so they still surface under Related.
    if (SEASON_TYPES.has(type)) {
      const format = (node.format || "").toUpperCase();
      if (
        !format ||
        format === "TV" ||
        format === "TV_SHORT" ||
        format === "ONA" ||
        format === "MOVIE"
      ) {
        continue;
      }
    }
    if (!RELATED_TYPES.has(type) && !SEASON_TYPES.has(type) && node.format !== "MOVIE") {
      continue;
    }

    const match = findCatalogMatch(node, byAniId, byMalId);
    if (!match) continue;
    if (seen.has(match.id)) continue;
    seen.add(match.id);

    const card = cardFromMatch(match, node);
    out.push({
      ...card,
      relationType: type,
      relationLabel: relationLabel(type, node.format),
    });
  }

  const order = [
    "PARENT",
    "SIDE_STORY",
    "SPIN_OFF",
    "ALTERNATIVE",
    "SUMMARY",
    "COMPILATION",
    "CONTAINS",
    "OTHER",
  ];
  out.sort(
    (a, b) =>
      order.indexOf(a.relationType) - order.indexOf(b.relationType) ||
      (a.media.seasonYear ?? 0) - (b.media.seasonYear ?? 0),
  );

  return out;
}

function genreOverlapScore(item: CatalogAnime, genres: string[]) {
  if (!genres.length) return 0;
  const set = new Set(item.genres.map((g) => g.toLowerCase()));
  let score = 0;
  for (const g of genres) {
    if (set.has(g.toLowerCase())) score += 1;
  }
  return score;
}

export function buildMoreLikeThis(
  anilist: AniListMedia | null | undefined,
  catalog: CatalogAnime[],
  options?: {
    excludeAniIds?: number[];
    excludeCatalogIds?: number[];
    limit?: number;
  },
): RelatedMediaCard[] {
  const limit = options?.limit ?? 16;
  const byAniId = buildAniIdIndex(catalog);
  const byMalId = buildMalIdIndex(catalog);
  const excludeAni = new Set(options?.excludeAniIds ?? []);
  const excludeCat = new Set(options?.excludeCatalogIds ?? []);
  if (anilist?.id) excludeAni.add(anilist.id);

  const out: RelatedMediaCard[] = [];
  const seenCat = new Set<number>();

  const push = (card: RelatedMediaCard) => {
    if (seenCat.has(card.match.id) || excludeCat.has(card.match.id)) return;
    if (excludeAni.has(card.media.id)) return;
    seenCat.add(card.match.id);
    out.push(card);
  };

  for (const node of anilist?.recommendations?.nodes ?? []) {
    const media = node.mediaRecommendation;
    if (!media) continue;
    const match = findCatalogMatch(media, byAniId, byMalId);
    if (!match) continue;
    push(cardFromMatch(match, media));
    if (out.length >= limit) return out;
  }

  const genres = anilist?.genres ?? [];
  const minOverlap = Math.min(2, Math.max(1, genres.length));
  const scored = catalog
    .map((item) => {
      const overlap = genreOverlapScore(item, genres);
      const rating = Number(item.score) || 0;
      return { item, overlap, rating };
    })
    .filter((x) => x.overlap >= minOverlap)
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        b.rating - a.rating ||
        (b.item.year ?? 0) - (a.item.year ?? 0),
    );

  for (const { item } of scored) {
    push(cardFromMatch(item));
    if (out.length >= limit) break;
  }

  return out.slice(0, limit);
}
