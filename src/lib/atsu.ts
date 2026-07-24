import type {
  MangaChapter,
  MangaDetail,
  MangaListItem,
  MangaPageImage,
  MangaType,
} from "./manga-types";

const DOMAIN = "atsu.moe";
const ORIGIN = `https://${DOMAIN}`;
const CDN = `https://cdn.${DOMAIN}`;
/** Anikura manga shelf is Japanese only. */
const DEFAULT_TYPES = "Manga";

export type MangaShelfType = "Manga" | "Manwha" | "Manhua";

/** Curated Japanese manga genres (Atsumaru `tags` field). */
export const MANGA_SHELF_GENRES = [
  { slug: "action", name: "Action", tag: "Action" },
  { slug: "adventure", name: "Adventure", tag: "Adventure" },
  { slug: "fantasy", name: "Fantasy", tag: "Fantasy" },
  { slug: "romance", name: "Romance", tag: "Romance" },
  { slug: "comedy", name: "Comedy", tag: "Comedy" },
  { slug: "drama", name: "Drama", tag: "Drama" },
  { slug: "horror", name: "Horror", tag: "Horror" },
  { slug: "mystery", name: "Mystery", tag: "Mystery" },
  { slug: "supernatural", name: "Supernatural", tag: "Supernatural" },
  { slug: "sci-fi", name: "Sci-Fi", tag: "Sci-Fi" },
  { slug: "slice-of-life", name: "Slice of Life", tag: "Slice of Life" },
  { slug: "psychological", name: "Psychological", tag: "Psychological" },
  { slug: "historical", name: "Historical", tag: "Historical" },
  { slug: "martial-arts", name: "Martial Arts", tag: "Martial Arts" },
] as const;

export type MangaShelfGenreSlug = (typeof MANGA_SHELF_GENRES)[number]["slug"];
export type MangaBrowseSort = "trending" | "popular" | "latest" | "rating";

export function mangaGenreBySlug(slug: string | undefined | null) {
  if (!slug) return null;
  return MANGA_SHELF_GENRES.find((g) => g.slug === slug) ?? null;
}

type FetchOptions = {
  revalidate?: number | false;
  cache?: RequestCache;
};

function typesParam(types?: MangaShelfType | MangaShelfType[] | string) {
  if (!types) return DEFAULT_TYPES;
  if (Array.isArray(types)) return types.join(",");
  return types;
}

async function fetchJson<T>(
  url: string,
  options: FetchOptions = { revalidate: 300 },
  retries = 3,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const init: RequestInit & { next?: { revalidate?: number | false } } = {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (compatible; Anikura/1.0; +https://anikura.club)",
          Referer: `${ORIGIN}/`,
        },
      };

      if (options.cache) init.cache = options.cache;
      if (options.revalidate !== undefined) {
        init.next = { revalidate: options.revalidate };
      }

      const res = await fetch(url, init);

      if (res.status === 429) {
        await sleep(1500 * (attempt + 1));
        continue;
      }

      if (!res.ok) {
        throw new Error(`Atsumaru ${res.status}: ${url}`);
      }

      return (await res.json()) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      await sleep(600 * (attempt + 1));
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const clean = path.replace(/^\/+/, "").replace(/^static\//, "");
  return `${CDN}/static/${clean}`;
}

function pickPoster(
  raw:
    | string
    | {
        image?: string;
        smallImage?: string;
        mediumImage?: string;
        largeImage?: string;
      }
    | null
    | undefined,
  prefer: "small" | "medium" | "large" | "full" = "medium",
): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return assetUrl(raw);

  const order =
    prefer === "small"
      ? [raw.smallImage, raw.mediumImage, raw.largeImage, raw.image]
      : prefer === "large"
        ? [raw.largeImage, raw.mediumImage, raw.image, raw.smallImage]
        : prefer === "full"
          ? [raw.image, raw.largeImage, raw.mediumImage, raw.smallImage]
          : [raw.mediumImage, raw.largeImage, raw.image, raw.smallImage];

  for (const candidate of order) {
    const url = assetUrl(candidate);
    if (url) return url;
  }
  return null;
}

function asListItem(raw: Record<string, unknown>): MangaListItem {
  const posterRaw =
    (raw.poster as Parameters<typeof pickPoster>[0]) ??
    (raw.image as string | undefined) ??
    (raw.mediumImage as string | undefined);

  const rating =
    typeof raw.mbRating === "number"
      ? raw.mbRating
      : typeof raw.avgRating === "number"
        ? raw.avgRating
        : null;

  return {
    id: String(raw.id),
    title: String(raw.title || raw.englishTitle || "Untitled"),
    type: String(raw.type || "Manga") as MangaType,
    isAdult: Boolean(raw.isAdult),
    rating,
    views: raw.views != null ? String(raw.views) : null,
    poster: pickPoster(
      typeof posterRaw === "string"
        ? posterRaw
        : {
            image: (raw.image as string) || undefined,
            smallImage: (raw.smallImage as string) || undefined,
            mediumImage: (raw.mediumImage as string) || undefined,
            largeImage: (raw.largeImage as string) || undefined,
            ...(typeof posterRaw === "object" && posterRaw ? posterRaw : {}),
          },
      "medium",
    ),
    posterSmall: pickPoster(
      {
        image: (raw.image as string) || undefined,
        smallImage: (raw.smallImage as string) || undefined,
        mediumImage: (raw.mediumImage as string) || undefined,
        largeImage: (raw.largeImage as string) || undefined,
      },
      "small",
    ),
  };
}

function asChapter(raw: Record<string, unknown>): MangaChapter {
  const created = raw.createdAt;
  let createdAt: string | null = null;
  if (typeof created === "string") createdAt = created;
  else if (typeof created === "number") {
    createdAt = new Date(created > 1e12 ? created : created * 1000).toISOString();
  }

  return {
    id: String(raw.id),
    title: String(raw.title || `Chapter ${raw.number ?? ""}`).trim(),
    number: Number(raw.number ?? 0),
    index: Number(raw.index ?? 0),
    pageCount: Number(raw.pageCount ?? 0),
    createdAt,
    scanlationMangaId:
      raw.scanlationMangaId != null ? String(raw.scanlationMangaId) : null,
  };
}

/** Keep one chapter per number — prefer more pages, then newer upload. */
export function dedupeChapters(chapters: MangaChapter[]): MangaChapter[] {
  const best = new Map<number, MangaChapter>();

  for (const chapter of chapters) {
    const existing = best.get(chapter.number);
    if (!existing) {
      best.set(chapter.number, chapter);
      continue;
    }
    if (chapter.pageCount > existing.pageCount) {
      best.set(chapter.number, chapter);
      continue;
    }
    if (
      chapter.pageCount === existing.pageCount &&
      (chapter.createdAt || "") > (existing.createdAt || "")
    ) {
      best.set(chapter.number, chapter);
    }
  }

  return [...best.values()].sort((a, b) => a.number - b.number);
}

export function mangaHref(id: string) {
  return `/manga/${id}`;
}

export function mangaReadHref(id: string, chapterId: string) {
  return `/manga/${id}/read/${chapterId}`;
}

export function formatMangaRating(rating: number | null | undefined) {
  if (rating == null || !Number.isFinite(rating) || rating <= 0) return null;
  return rating.toFixed(1);
}

export function formatMangaType(type: string | null | undefined) {
  if (!type) return "Manga";
  if (type === "Manwha") return "Manhwa";
  return type;
}

type InfiniteResponse = { items?: Record<string, unknown>[] };

export async function getTrendingManga(
  page = 0,
  types?: MangaShelfType | MangaShelfType[] | string,
  options: FetchOptions = { revalidate: 120 },
) {
  const url = `${ORIGIN}/api/infinite/trending?page=${page}&types=${encodeURIComponent(typesParam(types))}`;
  const json = await fetchJson<InfiniteResponse>(url, options);
  return (json.items || [])
    .map(asListItem)
    .filter((item) => !item.isAdult);
}

export async function getRecentlyUpdatedManga(
  page = 0,
  types?: MangaShelfType | MangaShelfType[] | string,
  options: FetchOptions = { revalidate: 60 },
) {
  const url = `${ORIGIN}/api/infinite/recentlyUpdated?page=${page}&types=${encodeURIComponent(typesParam(types))}`;
  const json = await fetchJson<InfiniteResponse>(url, options);
  return (json.items || [])
    .map(asListItem)
    .filter((item) => !item.isAdult);
}

type SearchResponse = {
  hits?: { document?: Record<string, unknown> }[];
  found?: number;
};

function mangaSearchFilter(genreTag?: string | null) {
  const parts = ["type:=Manga", "isAdult:=false"];
  if (genreTag) parts.push(`tags:=${genreTag}`);
  return parts.join(" && ");
}

async function typesenseManga(
  params: {
    query?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    genreTag?: string | null;
  },
  options: FetchOptions = { revalidate: 180 },
) {
  const q = params.query?.trim() || "*";
  const search = new URLSearchParams({
    q,
    query_by: "title,englishTitle,otherNames",
    limit: String(params.limit ?? 24),
    page: String(params.page ?? 1),
    query_by_weights: "3,2,1",
    include_fields:
      "id,title,englishTitle,poster,posterMedium,posterSmall,type,isAdult,mbRating,avgRating,views",
    filter_by: mangaSearchFilter(params.genreTag),
    num_typos: "4,3,2",
  });
  if (params.sortBy) search.set("sort_by", params.sortBy);

  const url = `${ORIGIN}/collections/manga/documents/search?${search}`;
  const json = await fetchJson<SearchResponse>(url, options);
  const items = (json.hits || [])
    .map((hit) => hit.document)
    .filter(Boolean)
    .map((doc) => {
      const raw = doc as Record<string, unknown>;
      // Prefer Typesense poster fields when infinite-API shape is missing.
      if (!raw.poster && raw.posterMedium) raw.poster = raw.posterMedium;
      return asListItem(raw);
    })
    .filter((item) => !item.isAdult && item.type === "Manga");

  return { items, found: json.found ?? items.length };
}

export async function searchManga(
  query: string,
  page = 1,
  limit = 24,
  options: FetchOptions = { revalidate: 120 },
  _typeFilter?: MangaShelfType | "all",
) {
  const q = query.trim();
  if (!q) return { items: [] as MangaListItem[], found: 0 };
  return typesenseManga({ query: q, page, limit }, options);
}

/** Browse Japanese manga by popularity, rating, or genre. */
export async function browseManga(
  opts: {
    sort?: MangaBrowseSort;
    genre?: string | null;
    page?: number;
    limit?: number;
  } = {},
  options: FetchOptions = { revalidate: 180 },
) {
  const sort = opts.sort ?? "popular";
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 24;
  const genre = mangaGenreBySlug(opts.genre);

  if (sort === "trending" && !genre) {
    const items = await getTrendingManga(page - 1, "Manga", options);
    return { items: items.slice(0, limit), found: items.length };
  }
  if (sort === "latest" && !genre) {
    const items = await getRecentlyUpdatedManga(page - 1, "Manga", options);
    return { items: items.slice(0, limit), found: items.length };
  }

  const sortBy =
    sort === "rating"
      ? "mbRating:desc"
      : sort === "latest"
        ? "dateAdded:desc"
        : "views:desc";

  return typesenseManga(
    {
      page,
      limit,
      sortBy,
      genreTag: genre?.tag,
    },
    options,
  );
}

export async function getMangaByGenre(
  genreSlug: string,
  limit = 18,
  options?: FetchOptions,
) {
  const result = await browseManga(
    { sort: "popular", genre: genreSlug, page: 1, limit },
    options,
  );
  return result.items;
}

type MangaPageResponse = { mangaPage?: Record<string, unknown> };

export async function getMangaDetail(
  id: string,
  options: FetchOptions = { revalidate: 180 },
): Promise<MangaDetail> {
  const url = `${ORIGIN}/api/manga/page?id=${encodeURIComponent(id)}`;
  const json = await fetchJson<MangaPageResponse>(url, options);
  const raw = json.mangaPage;
  if (!raw) throw new Error(`Manga not found: ${id}`);

  const posterObj = raw.poster as Parameters<typeof pickPoster>[0];
  const bannerObj = raw.banner as { url?: string } | null;
  const genres = Array.isArray(raw.genres)
    ? (raw.genres as { id?: string; name?: string; weight?: string }[])
        .filter((g) => g?.name)
        .map((g) => ({
          id: String(g.id || g.name),
          name: String(g.name),
          weight: g.weight,
        }))
    : [];
  const tags = Array.isArray(raw.tags)
    ? (raw.tags as { name?: string }[])
        .map((t) => t?.name)
        .filter((n): n is string => Boolean(n))
    : [];
  const authors = Array.isArray(raw.authors)
    ? (raw.authors as MangaDetail["authors"])
    : [];
  const scanlators = Array.isArray(raw.scanlators)
    ? (raw.scanlators as MangaScanlatorLike[])
        .filter((s) => s?.id && s?.name)
        .map((s) => ({ id: String(s.id), name: String(s.name) }))
    : [];
  const recentChapters = Array.isArray(raw.chapters)
    ? (raw.chapters as Record<string, unknown>[]).map(asChapter)
    : [];
  const otherNames = Array.isArray(raw.otherNames)
    ? (raw.otherNames as unknown[]).map(String).filter(Boolean)
    : [];

  return {
    id: String(raw.id),
    title: String(raw.title || "Untitled"),
    englishTitle: raw.englishTitle ? String(raw.englishTitle) : null,
    otherNames,
    type: String(raw.type || "Manga"),
    status: raw.status ? String(raw.status) : null,
    synopsis: raw.synopsis ? String(raw.synopsis) : null,
    isAdult: Boolean(raw.isAdult),
    rating: typeof raw.avgRating === "number" ? raw.avgRating : null,
    views: raw.views != null ? String(raw.views) : null,
    released: typeof raw.released === "number" ? raw.released : null,
    totalChapterCount:
      typeof raw.totalChapterCount === "number" ? raw.totalChapterCount : null,
    poster: pickPoster(posterObj, "medium"),
    posterLarge: pickPoster(posterObj, "large"),
    banner: assetUrl(bannerObj?.url),
    genres,
    tags,
    authors,
    scanlators,
    recentChapters,
  };
}

type MangaScanlatorLike = { id?: string; name?: string };

type ChaptersResponse = {
  chapters?: Record<string, unknown>[];
  pages?: number;
  page?: number;
};

export async function getMangaChaptersPage(
  id: string,
  page = 0,
  sort: "asc" | "desc" = "asc",
  options: FetchOptions = { revalidate: 60 },
) {
  const url = `${ORIGIN}/api/manga/chapters?id=${encodeURIComponent(id)}&filter=all&sort=${sort}&page=${page}`;
  const json = await fetchJson<ChaptersResponse>(url, options);
  return {
    chapters: (json.chapters || []).map(asChapter),
    pages: Math.max(1, Number(json.pages || 1)),
    page: Number(json.page ?? page),
  };
}

export async function getAllMangaChapters(
  id: string,
  options: FetchOptions = { revalidate: 60 },
) {
  const first = await getMangaChaptersPage(id, 0, "asc", options);
  if (first.pages <= 1) return dedupeChapters(first.chapters);

  const rest = await Promise.all(
    Array.from({ length: first.pages - 1 }, (_, i) =>
      getMangaChaptersPage(id, i + 1, "asc", options),
    ),
  );

  return dedupeChapters([
    ...first.chapters,
    ...rest.flatMap((page) => page.chapters),
  ]);
}

type ReadResponse = {
  readChapter?: {
    id?: string;
    title?: string;
    pages?: {
      id?: string;
      image?: string;
      number?: number;
      width?: number;
      height?: number;
      aspectRatio?: number;
    }[];
  };
};

export async function getChapterPages(
  mangaId: string,
  chapterId: string,
  options: FetchOptions = { revalidate: 120 },
): Promise<{ id: string; title: string; pages: MangaPageImage[] }> {
  const url = `${ORIGIN}/api/read/chapter?mangaId=${encodeURIComponent(mangaId)}&chapterId=${encodeURIComponent(chapterId)}`;
  const json = await fetchJson<ReadResponse>(url, options);
  const chapter = json.readChapter;
  if (!chapter) throw new Error(`Chapter not found: ${chapterId}`);

  const pages = (chapter.pages || []).map((page, index) => {
    const src = assetUrl(page.image);
    if (!src) {
      throw new Error(`Missing page image for ${chapterId}#${index}`);
    }
    return {
      id: String(page.id || `${chapterId}-${index}`),
      src,
      number: Number(page.number ?? index),
      width: Number(page.width || 800),
      height: Number(page.height || 1200),
      aspectRatio: Number(page.aspectRatio || 0.66),
    };
  });

  return {
    id: String(chapter.id || chapterId),
    title: String(chapter.title || "Chapter"),
    pages,
  };
}
