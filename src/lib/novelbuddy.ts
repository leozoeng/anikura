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
    summary: stripNovelHtml(
      raw.summary != null ? String(raw.summary) : null,
    ).slice(0, 280) || null,
    isAdult: Boolean(raw.is_adult),
    isMtl: Boolean(raw.is_mtl),
    isHot: Boolean(raw.is_hot),
    genres,
    updatedAt: raw.updated_at ? String(raw.updated_at) : null,
  };
}

function isBlockedNovel(item: {
  isAdult?: boolean;
  genres?: string[] | NovelGenre[];
  title?: string;
}) {
  if (item.isAdult) return true;
  const names = (item.genres || []).map((g) =>
    typeof g === "string" ? g.toLowerCase() : g.name.toLowerCase(),
  );
  if (names.some((n) => ["adult", "smut", "ecchi"].includes(n))) return true;
  const title = (item.title || "").toLowerCase();
  if (/\b(r-18|hentai|smut)\b/i.test(title)) return true;
  return false;
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
  options: FetchOptions = { revalidate: 180 },
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const q = query?.trim();
  if (q) params.set("q", q);

  const json = await fetchJson<SearchResponse>(
    `/titles/search?${params}`,
    options,
  );
  const items = (json.data?.items || [])
    .map(asListItem)
    .filter((item) => !isBlockedNovel(item));

  return {
    items,
    total: json.data?.pagination?.total ?? items.length,
    page: json.data?.pagination?.page ?? page,
    totalPages: json.data?.pagination?.total_pages ?? 1,
    hasNext: Boolean(json.data?.pagination?.has_next),
  };
}

/** Fresh ink — latest catalog page from NovelBuddy. */
export async function getLatestNovels(
  page = 1,
  limit = 24,
  options?: FetchOptions,
) {
  return searchNovels(null, page, limit, options);
}

/** Popular shelf — browse latest pages and rank by views. */
export async function getPopularNovels(
  limit = 24,
  options: FetchOptions = { revalidate: 300 },
) {
  const pages = await Promise.all([
    searchNovels(null, 1, 48, options),
    searchNovels(null, 2, 48, options),
    searchNovels("the", 1, 24, options),
  ]);

  const map = new Map<string, NovelListItem>();
  for (const page of pages) {
    for (const item of page.items) {
      if (item.isMtl) continue;
      const existing = map.get(item.id);
      if (!existing || (item.views || 0) > (existing.views || 0)) {
        map.set(item.id, item);
      }
    }
  }

  return [...map.values()]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);
}

type DetailResponse = {
  success?: boolean;
  data?: { title?: Record<string, unknown> };
};

export async function getNovelDetail(
  id: string,
  options: FetchOptions = { revalidate: 300 },
): Promise<NovelDetail> {
  const json = await fetchJson<DetailResponse>(
    `/titles/${encodeURIComponent(id)}`,
    options,
  );
  const raw = json.data?.title;
  if (!raw) throw new Error(`Novel not found: ${id}`);

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
  options: FetchOptions = { revalidate: 300 },
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
  options: FetchOptions = { revalidate: 600 },
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
      slug: String(g.slug || g.name || ""),
    }))
    .filter(
      (g) =>
        g.name &&
        !["adult", "smut", "ecchi"].includes(g.name.toLowerCase()),
    );
}
