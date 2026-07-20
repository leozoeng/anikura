import type { AniListMedia, AniListTitle } from "@/lib/anilist";
import type { CatalogAnime } from "@/lib/types";

export type CatalogMatch = {
  id: number;
  slug: string;
  poster: string;
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

function normalizeTitle(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

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

function findCatalogMatch(
  media: { id: number; title: AniListTitle },
  byAniId: Map<number, CatalogAnime>,
  catalog: CatalogAnime[],
): CatalogAnime | null {
  const direct = byAniId.get(media.id);
  if (direct) return direct;

  const candidates = [
    media.title.english,
    media.title.romaji,
    media.title.native,
  ]
    .map(normalizeTitle)
    .filter(Boolean);

  if (!candidates.length) return null;

  for (const item of catalog) {
    const titles = [
      item.title,
      item.alternative,
      item.native,
      item.titles,
    ]
      .map(normalizeTitle)
      .filter(Boolean);
    if (titles.some((t) => candidates.includes(t))) return item;
  }

  return null;
}

function toMatch(item: CatalogAnime): CatalogMatch {
  return { id: item.id, slug: item.slug, poster: item.poster };
}

export function buildRelatedEntries(
  anilist: AniListMedia | null | undefined,
  catalog: CatalogAnime[],
  byAniId = buildAniIdIndex(catalog),
): RelatedEntry[] {
  const edges = anilist?.relations?.edges ?? [];
  const seen = new Set<number>();
  const out: RelatedEntry[] = [];

  for (const edge of edges) {
    const node = edge.node;
    if (!node || node.type !== "ANIME") continue;
    const type = edge.relationType || "OTHER";
    if (!RELATED_TYPES.has(type) && node.format !== "MOVIE") continue;
    if (seen.has(node.id)) continue;

    const match = findCatalogMatch(node, byAniId, catalog);
    if (!match) continue;

    seen.add(node.id);
    out.push({
      relationType: type,
      relationLabel: relationLabel(type, node.format),
      media: {
        id: node.id,
        title: node.title,
        coverImage: node.coverImage,
        seasonYear: node.seasonYear,
        format: node.format,
      },
      match: toMatch(match),
    });
  }

  const order = [
    "PREQUEL",
    "SEQUEL",
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

function fromCatalogItem(item: CatalogAnime): RelatedMediaCard {
  return {
    media: {
      id: Number(item.ani_id) || item.id,
      title: { english: item.title, romaji: item.title, native: item.native },
      coverImage: { large: item.poster },
      seasonYear: item.year ?? null,
      format: item.terms_by_type?.type?.[0] ?? null,
    },
    match: toMatch(item),
  };
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
    const match = findCatalogMatch(media, byAniId, catalog);
    if (!match) continue;
    push({
      media: {
        id: media.id,
        title: media.title,
        coverImage: media.coverImage,
        seasonYear: media.seasonYear,
        format: media.format,
      },
      match: toMatch(match),
    });
    if (out.length >= limit) return out;
  }

  const genres = anilist?.genres ?? [];
  const scored = catalog
    .map((item) => {
      const overlap = genreOverlapScore(item, genres);
      const rating = Number(item.score) || 0;
      return { item, overlap, rating };
    })
    .filter((x) => x.overlap > 0)
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        b.rating - a.rating ||
        (b.item.year ?? 0) - (a.item.year ?? 0),
    );

  for (const { item } of scored) {
    push(fromCatalogItem(item));
    if (out.length >= limit) break;
  }

  if (out.length < Math.min(8, limit)) {
    const top = [...catalog]
      .filter((a) => a.score && a.score !== "N/A" && Number(a.score) > 0)
      .sort((a, b) => Number(b.score) - Number(a.score));
    for (const item of top) {
      push(fromCatalogItem(item));
      if (out.length >= limit) break;
    }
  }

  return out.slice(0, limit);
}
