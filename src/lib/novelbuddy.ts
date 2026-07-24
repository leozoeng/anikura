import type {
  NovelChapter,
  NovelChapterContent,
  NovelDetail,
  NovelGenre,
  NovelListItem,
} from "./novel-types";

const API = "https://api.novelbuddy.me";
const ORIGIN = "https://novelbuddy.me";

type FetchOptions = {
  revalidate?: number | false;
  cache?: RequestCache;
};

async function fetchJson<T>(
  path: string,
  options: FetchOptions = { revalidate: 300 },
  retries = 3,
): Promise<T> {
  let lastError: Error | null = null;
  const url = path.startsWith("http") ? path : `${API}${path}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const init: RequestInit & { next?: { revalidate?: number | false } } = {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (compatible; Anikura/1.0; +https://anikura.club)",
          Referer: `${ORIGIN}/`,
          Origin: ORIGIN,
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
      if (!res.ok) throw new Error(`NovelBuddy ${res.status}: ${url}`);
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

export function stripNovelHtml(html: string | null | undefined) {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Allow a tight set of tags for the reader body. */
export function sanitizeNovelHtml(html: string) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/ on\w+="[^"]*"/gi, "")
    .replace(/ on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");

  // Drop tags we don't want, keep basic prose markup.
  return cleaned.replace(
    /<\/?(?!p\b|br\b|em\b|i\b|strong\b|b\b|span\b|h[1-6]\b|blockquote\b|hr\b|ul\b|ol\b|li\b)([a-z0-9:-]+)[^>]*>/gi,
    "",
  );
}

function asChapter(raw: Record<string, unknown> | null | undefined): NovelChapter | null {
  if (!raw || raw.id == null) return null;
  return {
    id: String(raw.id),
    title: String(raw.name || raw.title || "Chapter"),
    slug: String(raw.slug || ""),
    number:
      typeof raw.number === "number"
        ? raw.number
        : raw.number != null && raw.number !== ""
          ? Number(raw.number)
          : null,
    updatedAt: raw.updated_at ? String(raw.updated_at) : null,
    views: typeof raw.views === "number" ? raw.views : null,
  };
}

function asListItem(raw: Record<string, unknown>): NovelListItem {
  const stats = (raw.stats as Record<string, unknown> | undefined) || {};
  const genres = Array.isArray(raw.genres)
    ? (raw.genres as { name?: string }[])
        .map((g) => g?.name)
        .filter((n): n is string => Boolean(n))
    : [];

  const originRaw = raw.type;
  let origin: string | null = null;
  if (typeof originRaw === "string") origin = originRaw;
  else if (originRaw && typeof originRaw === "object") {
    const o = originRaw as { name?: string; slug?: string };
    origin = o.slug || o.name || null;
  }

  const title = String(raw.name || "Untitled");
  const isMtl =
    Boolean(raw.is_mtl) || /^mtl[\s\-–—]/i.test(title) || /\bMTL\b/.test(title);

  return {
    id: String(raw.id),
    slug: String(raw.slug || raw.id),
    title,
    cover: raw.cover ? String(raw.cover) : null,
    status: raw.status ? String(raw.status) : null,
    rating: typeof raw.rating === "number" ? raw.rating : null,
    views: typeof stats.views === "number" ? stats.views : null,
    chaptersCount:
      typeof stats.chapters_count === "number" ? stats.chapters_count : null,
    summary: stripNovelHtml(
      raw.summary != null ? String(raw.summary) : null,
    ).slice(0, 280) || null,
    isAdult: Boolean(raw.is_adult),
    isMtl,
    isHot: Boolean(raw.is_hot),
    origin: origin ? String(origin).toLowerCase() : null,
    genres,
    updatedAt: raw.updated_at ? String(raw.updated_at) : null,
  };
}

const BLOCKED_GENRES = new Set([
  "adult",
  "smut",
  "fan-fiction",
  "fanfiction",
]);

/** Omegaverse / mafia / heat romance + obvious western fanfic spam. */
const BLOCKED_TITLE =
  /\b(mate[ds]?|alphas?|omegas?|mafia|dadd(?:y|ies)|breeding|claimed me|sold me|went into heat|pregnant by|heat and my|omegaverse|reverse harem|roommates with benefits|seduce the|slave harem|taboo harem|milf|tentacle|stepbrother|stepsister|harry potter|warhammer|marvel\s*:|dc comics|football manager)\b/i;

const FANFIC_PREFIX =
  /^(naruto|one piece|bleach|pokemon|boruto|fairy tail|dragon ball|harry potter|marvel|dc|warhammer|cyberpunk|douluo dalu)\s*[:\-]/i;

const ANIME_SHELF_GENRES = new Set([
  "action",
  "adventure",
  "fantasy",
  "comedy",
  "drama",
  "mystery",
  "horror",
  "sci-fi",
  "scifi",
  "school life",
  "martial arts",
  "mecha",
  "supernatural",
  "psychological",
  "seinen",
  "shounen",
  "shoujo",
  "slice of life",
  "system",
  "reincarnation",
  "eastern",
  "xianxia",
  "xuanhuan",
  "wuxia",
  "historical",
  "tragedy",
  "sports",
  "game",
  "isekai",
]);

const ACTION_SPINE = new Set([
  "action",
  "adventure",
  "martial arts",
  "mecha",
  "sci-fi",
  "scifi",
  "shounen",
  "seinen",
  "xianxia",
  "xuanhuan",
  "wuxia",
  "system",
  "isekai",
]);

export type NovelOrigin = "japanese" | "korean" | "chinese";

/** Curated anime-shelf novel genres shown on /novels. */
export const NOVEL_SHELF_GENRES = [
  { slug: "action", name: "Action" },
  { slug: "adventure", name: "Adventure" },
  { slug: "fantasy", name: "Fantasy" },
  { slug: "comedy", name: "Comedy" },
  { slug: "drama", name: "Drama" },
  { slug: "romance", name: "Romance" },
  { slug: "mystery", name: "Mystery" },
  { slug: "horror", name: "Horror" },
  { slug: "sci-fi", name: "Sci-Fi" },
  { slug: "school-life", name: "School Life" },
  { slug: "slice-of-life", name: "Slice of Life" },
  { slug: "supernatural", name: "Supernatural" },
  { slug: "mecha", name: "Mecha" },
  { slug: "seinen", name: "Seinen" },
  { slug: "shounen", name: "Shounen" },
] as const;

export type NovelShelfGenreSlug = (typeof NOVEL_SHELF_GENRES)[number]["slug"];
export type NovelBrowseSort = "popular" | "latest";

export function novelGenreBySlug(slug: string | undefined | null) {
  if (!slug) return null;
  return NOVEL_SHELF_GENRES.find((g) => g.slug === slug) ?? null;
}

function isAnimeShelfNovel(item: NovelListItem) {
  if (item.isMtl) return false;
  if (BLOCKED_TITLE.test(item.title) || FANFIC_PREFIX.test(item.title)) {
    return false;
  }

  const genres = item.genres.map((g) => g.toLowerCase());
  if (genres.some((g) => BLOCKED_GENRES.has(g))) return false;

  // NovelBuddy marks many real LNs as adult — only trust the flag with smut genres
  // or when there is no adventure / shounen spine at all.
  const hasActionSpine = genres.some((g) => ACTION_SPINE.has(g));
  if (item.isAdult && !hasActionSpine) return false;

  const hasAnimeSpine = genres.some((g) => ANIME_SHELF_GENRES.has(g));
  if (!hasAnimeSpine) return false;

  // Yaoi/Yuri / pure romance without an action spine → romance spam on this source
  const blTagged =
    genres.includes("yaoi") ||
    genres.includes("yuri") ||
    genres.includes("bl") ||
    genres.includes("gl");
  if (blTagged && !hasActionSpine) return false;

  if (genres.includes("romance") && !hasActionSpine && blTagged) return false;

  // Pure palace / husband / empress romance with no adventure spine
  if (
    genres.includes("romance") &&
    !hasActionSpine &&
    !genres.some((g) =>
      ["fantasy", "supernatural", "reincarnation", "isekai", "comedy"].includes(
        g,
      ),
    )
  ) {
    return false;
  }

  // Harem + romance with no action spine (KR web-novel spam)
  if (
    genres.includes("harem") &&
    genres.includes("romance") &&
    !hasActionSpine
  ) {
    return false;
  }

  return true;
}

export function novelHref(id: string) {
  return `/novels/${id}`;
}

export function novelReadHref(id: string, chapterId: string) {
  return `/novels/${id}/read/${chapterId}`;
}

export function formatNovelViews(views: number | null | undefined) {
  if (views == null || !Number.isFinite(views)) return null;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return String(views);
}

export function formatNovelRating(rating: number | null | undefined) {
  if (rating == null || !Number.isFinite(rating) || rating <= 0) return null;
  return rating.toFixed(1);
}

type SearchResponse = {
  success?: boolean;
  data?: {
    items?: Record<string, unknown>[];
    pagination?: {
      total?: number;
      page?: number;
      limit?: number;
      total_pages?: number;
      has_next?: boolean;
    };
  };
};

export async function searchNovels(
  query: string | null,
  page = 1,
  limit = 24,
  options: FetchOptions = { revalidate: 120 },
  origin: NovelOrigin | "all" = "japanese",
  extras?: { genre?: string | null; sort?: NovelBrowseSort },
) {
  // Oversample — anime filter drops romance/MTL spam.
  const fetchLimit = Math.min(48, Math.max(limit * 3, limit));
  const params = new URLSearchParams({
    page: String(page),
    limit: String(fetchLimit),
  });
  const q = query?.trim();
  if (q) params.set("q", q);
  if (origin && origin !== "all") params.set("type", origin);
  if (extras?.genre) params.set("genres", extras.genre);
  // Default browse is newest junk; popular keeps real LNs on top.
  const sort = extras?.sort ?? (q ? undefined : "popular");
  if (sort === "popular") params.set("sort", "popular");
  if (sort === "latest") params.set("sort", "latest");

  const json = await fetchJson<SearchResponse>(
    `/titles/search?${params}`,
    options,
  );
  const items = (json.data?.items || [])
    .map(asListItem)
    .map((item) =>
      origin && origin !== "all" && !item.origin
        ? { ...item, origin }
        : item,
    )
    .filter((item) => isAnimeShelfNovel(item))
    .slice(0, limit);

  return {
    items,
    total: json.data?.pagination?.total ?? items.length,
    page: json.data?.pagination?.page ?? page,
    totalPages: json.data?.pagination?.total_pages ?? 1,
    hasNext: Boolean(json.data?.pagination?.has_next),
  };
}

/** Japanese light novels — the only Anikura novel shelf. */
export async function getJapaneseNovels(
  page = 1,
  limit = 24,
  options?: FetchOptions,
  extras?: { genre?: string | null; sort?: NovelBrowseSort },
) {
  return searchNovels(null, page, limit, options, "japanese", extras);
}

export async function getNovelsByGenre(
  genreSlug: string,
  limit = 18,
  options?: FetchOptions,
) {
  const genre = novelGenreBySlug(genreSlug);
  if (!genre) return [] as NovelListItem[];
  const result = await getJapaneseNovels(1, limit, options, {
    genre: genre.slug,
    sort: "popular",
  });
  return result.items;
}

/** Fresh ink — Japanese only. */
export async function getLatestNovels(
  page = 1,
  limit = 24,
  options?: FetchOptions,
) {
  return getJapaneseNovels(page, limit, options, { sort: "latest" });
}

/** Popular Japanese light novels. */
export async function getPopularNovels(
  limit = 24,
  options: FetchOptions = { revalidate: 300 },
) {
  const result = await getJapaneseNovels(1, limit, options, {
    sort: "popular",
  });
  return result.items;
}

type DetailResponse = {
  success?: boolean;
  data?: { title?: Record<string, unknown> };
};

export async function getNovelDetail(
  id: string,
  options: FetchOptions = { revalidate: 180 },
): Promise<NovelDetail> {
  const json = await fetchJson<DetailResponse>(
    `/titles/${encodeURIComponent(id)}`,
    options,
  );
  const raw = json.data?.title;
  if (!raw) throw new Error(`Novel not found: ${id}`);

  const listProbe = asListItem({
    ...raw,
    name: raw.name,
    is_adult: raw.is_adult,
    is_mtl: raw.is_mtl,
    genres: raw.genres,
    stats: raw.stats,
    type: raw.type,
  });
  if (!isAnimeShelfNovel(listProbe)) {
    throw new Error(`Novel filtered: ${id}`);
  }

  const stats = (raw.stats as Record<string, unknown> | undefined) || {};
  const authors = Array.isArray(raw.authors)
    ? (raw.authors as { name?: string; slug?: string }[])
        .filter((a) => a?.name)
        .map((a) => ({ name: String(a.name), slug: a.slug }))
    : [];
  const genres = Array.isArray(raw.genres)
    ? (raw.genres as { id?: string; name?: string; slug?: string }[])
        .filter((g) => g?.name)
        .map((g) => ({
          id: String(g.id || g.slug || g.name),
          name: String(g.name),
          slug: String(g.slug || g.name),
        }))
    : [];
  const tags = Array.isArray(raw.tags)
    ? (raw.tags as { name?: string }[])
        .map((t) => t?.name)
        .filter((n): n is string => Boolean(n))
    : [];

  const previewChapters = Array.isArray(raw.chapters)
    ? (raw.chapters as Record<string, unknown>[])
        .map(asChapter)
        .filter((c): c is NovelChapter => Boolean(c))
    : [];
  const latestChapters = Array.isArray(raw.latest_chapters)
    ? (raw.latest_chapters as Record<string, unknown>[])
        .map(asChapter)
        .filter((c): c is NovelChapter => Boolean(c))
    : [];

  return {
    id: String(raw.id),
    slug: String(raw.slug || raw.id),
    title: String(raw.name || "Untitled"),
    cover: raw.cover ? String(raw.cover) : null,
    status: raw.status ? String(raw.status) : null,
    rating: typeof raw.rating === "number" ? raw.rating : null,
    views: typeof stats.views === "number" ? stats.views : null,
    chaptersCount:
      typeof stats.chapters_count === "number" ? stats.chapters_count : null,
    summary: stripNovelHtml(raw.summary != null ? String(raw.summary) : null) || null,
    isAdult: Boolean(raw.is_adult),
    authors,
    genres,
    tags,
    firstChapter: asChapter(
      raw.first_chapter as Record<string, unknown> | undefined,
    ),
    latestChapters,
    previewChapters,
    updatedAt: raw.updated_at ? String(raw.updated_at) : null,
  };
}

type ChaptersResponse = {
  success?: boolean;
  data?: { chapters?: Record<string, unknown>[] };
};

export async function getNovelChapters(
  id: string,
  options: FetchOptions = { revalidate: 60 },
) {
  const json = await fetchJson<ChaptersResponse>(
    `/titles/${encodeURIComponent(id)}/chapters`,
    options,
  );
  const chapters = (json.data?.chapters || [])
    .map(asChapter)
    .filter((c): c is NovelChapter => Boolean(c));

  // API returns newest-first; normalize to ascending for reading order.
  return [...chapters].sort((a, b) => {
    const an = a.number ?? 0;
    const bn = b.number ?? 0;
    if (an !== bn) return an - bn;
    return (a.updatedAt || "").localeCompare(b.updatedAt || "");
  });
}

type ReadResponse = {
  success?: boolean;
  data?: { chapter?: Record<string, unknown> };
};

export async function getNovelChapterContent(
  novelId: string,
  chapterId: string,
  options: FetchOptions = { revalidate: 120 },
): Promise<NovelChapterContent> {
  const json = await fetchJson<ReadResponse>(
    `/titles/${encodeURIComponent(novelId)}/chapters/${encodeURIComponent(chapterId)}`,
    options,
  );
  const raw = json.data?.chapter;
  if (!raw) throw new Error(`Chapter not found: ${chapterId}`);

  const html = sanitizeNovelHtml(String(raw.content || ""));
  if (!html.trim()) throw new Error(`Empty chapter: ${chapterId}`);

  return {
    id: String(raw.id || chapterId),
    title: String(raw.name || "Chapter"),
    number: typeof raw.number === "number" ? raw.number : null,
    html,
    wordCount: typeof raw.word_count === "number" ? raw.word_count : null,
    readingMinutes:
      typeof raw.reading_time_minutes === "number"
        ? raw.reading_time_minutes
        : null,
  };
}

type GenresResponse = {
  success?: boolean;
  data?: { items?: Record<string, unknown>[] } | Record<string, unknown>[];
};

export async function getNovelGenres(
  options: FetchOptions = { revalidate: 3600 },
) {
  const json = await fetchJson<GenresResponse>("/genres", options);
  const rawItems = Array.isArray(json.data)
    ? json.data
    : json.data && "items" in json.data
      ? json.data.items || []
      : [];

  return rawItems
    .map((g) => ({
      id: String(g.id || g.slug || g.name),
      name: String(g.name || ""),
      slug: String(g.slug || g.name || "")
        .toLowerCase()
        .replace(/\s+/g, "-"),
      titlesCount:
        typeof g.titles_count === "number" ? g.titles_count : null,
    }))
    .filter(
      (g) =>
        g.name &&
        ![
          "adult",
          "smut",
          "ecchi",
          "fan-fiction",
          "fanfiction",
          "yaoi",
          "yuri",
        ].includes(g.name.toLowerCase()),
    );
}
