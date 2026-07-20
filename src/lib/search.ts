import { displayTitle, searchAniList, type AniListMedia } from "@/lib/anilist";
import { animeHref } from "@/lib/anikoto";
import { getCatalog, searchCatalog } from "@/lib/catalog";
import type { CatalogAnime } from "@/lib/types";

export type SearchHit = {
  key: string;
  title: string;
  native?: string | null;
  poster: string;
  year?: number | null;
  score?: string | number | null;
  href: string;
  source: "catalog" | "anilist";
};

const RESULT_LIMIT = 8;
/** Skip AniList when local catalog already has enough strong hits. */
const LOCAL_ENOUGH = 5;
const QUERY_CACHE_TTL_MS = 45_000;
const QUERY_CACHE_MAX = 48;

type CacheEntry = { results: SearchHit[]; at: number };

const queryCache = new Map<string, CacheEntry>();

function cacheGet(key: string): SearchHit[] | null {
  const hit = queryCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > QUERY_CACHE_TTL_MS) {
    queryCache.delete(key);
    return null;
  }
  // LRU: re-insert to refresh order
  queryCache.delete(key);
  queryCache.set(key, hit);
  return hit.results;
}

function cacheSet(key: string, results: SearchHit[]) {
  if (queryCache.has(key)) queryCache.delete(key);
  queryCache.set(key, { results, at: Date.now() });
  while (queryCache.size > QUERY_CACHE_MAX) {
    const oldest = queryCache.keys().next().value;
    if (oldest === undefined) break;
    queryCache.delete(oldest);
  }
}

function catalogHit(anime: CatalogAnime): SearchHit {
  return {
    key: `c-${anime.id}`,
    title: anime.title,
    native: anime.native,
    poster: anime.poster,
    year: anime.year,
    score: anime.score,
    href: animeHref(anime),
    source: "catalog",
  };
}

function anilistHit(media: AniListMedia): SearchHit {
  return {
    key: `a-${media.id}`,
    title: displayTitle(media.title),
    native: media.title.native,
    poster: media.coverImage?.large || "",
    year: media.seasonYear,
    score: media.averageScore,
    href: `/search?q=${encodeURIComponent(displayTitle(media.title))}`,
    source: "anilist",
  };
}

function mergeHits(
  local: CatalogAnime[],
  anilist: AniListMedia[],
  catalog: CatalogAnime[],
): SearchHit[] {
  const byAniId = new Map<number, CatalogAnime>();
  for (const item of catalog) {
    const ani = Number(item.ani_id);
    if (ani) byAniId.set(ani, item);
  }

  const results: SearchHit[] = [];
  const seen = new Set<string>();

  for (const anime of local) {
    const hit = catalogHit(anime);
    if (seen.has(hit.key)) continue;
    seen.add(hit.key);
    results.push(hit);
  }

  for (const media of anilist) {
    const matched = byAniId.get(media.id);
    if (matched) {
      const hit = catalogHit(matched);
      if (media.title.native && !hit.native) hit.native = media.title.native;
      if (!hit.poster && media.coverImage?.large) {
        hit.poster = media.coverImage.large;
      }
      if (!hit.year && media.seasonYear) hit.year = media.seasonYear;
      if (!hit.score && media.averageScore) hit.score = media.averageScore;
      if (seen.has(hit.key)) continue;
      seen.add(hit.key);
      results.push(hit);
      continue;
    }

    const hit = anilistHit(media);
    if (seen.has(hit.key)) continue;
    seen.add(hit.key);
    results.push(hit);
  }

  return results.slice(0, RESULT_LIMIT);
}

/**
 * Quick local-only search for instant command-palette hits.
 */
export async function searchLocal(query: string, limit = RESULT_LIMIT) {
  const q = query.trim();
  if (q.length < 2) return [] as SearchHit[];

  const cacheKey = `local:${q.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const local = await searchCatalog(q, limit);
  const results = local.map(catalogHit);
  cacheSet(cacheKey, results);
  return results;
}

/**
 * Full search: catalog first, AniList only when local hits are sparse.
 */
export async function searchAnime(query: string, limit = RESULT_LIMIT) {
  const q = query.trim();
  if (q.length < 2) return [] as SearchHit[];

  const cacheKey = `full:${q.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  // One catalog load for both search + AniList id matching (getCatalog is memoized).
  const [local, catalog] = await Promise.all([
    searchCatalog(q, limit),
    getCatalog(),
  ]);

  let anilist: AniListMedia[] = [];
  if (local.length < LOCAL_ENOUGH) {
    anilist = await searchAniList(q, limit);
  }

  const results = mergeHits(local, anilist, catalog);
  cacheSet(cacheKey, results);
  // Local results are a prefix of full when AniList was skipped — keep local cache warm.
  if (!anilist.length) {
    cacheSet(`local:${q.toLowerCase()}`, results);
  }
  return results;
}
