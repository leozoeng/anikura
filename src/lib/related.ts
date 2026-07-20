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
  seasonIndex: number;
};

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

type FranchiseHit = {
  node: AniListRelationNode;
  relationType: "PREQUEL" | "SEQUEL";
};

/**
 * Full season list for the more-info / watch pages:
 * AniList prequel/sequel walk + catalog title siblings, including the current season.
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

  for (const { node, relationType } of hits.values()) {
    const match = findCatalogMatch(node, byAniId, byMalId);
    if (!match || match.id === current.id) continue;
    if (byCatalogId.has(match.id)) continue;
    const card = cardFromMatch(match, node);
    byCatalogId.set(match.id, {
      ...card,
      relationType,
      relationLabel:
        relationType === "PREQUEL" ? "Earlier season" : "Later season",
    });
  }

  // Catalog siblings (covers missing ani_ids / incomplete AniList links).
  for (const sibling of findCatalogSiblings(current, catalog)) {
    if (byCatalogId.has(sibling.id)) continue;
    const year = sibling.year ?? 0;
    const curYear = current.year ?? anilist?.seasonYear ?? 0;
    const relationType = year && curYear && year < curYear ? "PREQUEL" : "SEQUEL";
    byCatalogId.set(sibling.id, {
      ...cardFromMatch(sibling),
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
          format: anilist.format,
        }
      : undefined),
    relationType: "CURRENT",
    relationLabel: "Current",
  };

  const all = [...byCatalogId.values(), currentCard];
  all.sort(
    (a, b) =>
      (a.media.seasonYear ?? a.match.id) - (b.media.seasonYear ?? b.match.id) ||
      a.match.id - b.match.id,
  );

  // Need at least current + one other to show a seasons strip.
  if (all.length < 2) return [];

  return all.map((entry, i) => ({
    ...entry,
    seasonIndex: i + 1,
    isCurrent: entry.match.id === current.id,
    relationLabel:
      entry.match.id === current.id
        ? `Season ${i + 1} · Current`
        : `Season ${i + 1}`,
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
    // Seasons are handled by resolveFranchiseSeasons — skip here.
    if (SEASON_TYPES.has(type)) continue;
    if (!RELATED_TYPES.has(type) && node.format !== "MOVIE") continue;

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
