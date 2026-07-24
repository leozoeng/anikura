import type { AnimeSummary, SeriesResponse } from "./types";

const BASE = "https://www.anikotoapi.site";

type RecentResponse = {
  ok: boolean;
  data?: AnimeSummary[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  error?: string;
};

type SeriesApiResponse = {
  ok: boolean;
  data?: SeriesResponse;
  error?: string;
};

type FetchOptions = {
  cache?: RequestCache;
  revalidate?: number | false;
};

async function fetchJson<T>(url: string, options: FetchOptions = {}, retries = 3): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const init: RequestInit & { next?: { revalidate?: number | false } } = {
        headers: { Accept: "application/json" },
      };

      if (options.cache) init.cache = options.cache;
      if (options.revalidate !== undefined) {
        init.next = { revalidate: options.revalidate };
      }

      const res = await fetch(url, init);

      if (res.status === 429) {
        await sleep(2000 * (attempt + 1));
        continue;
      }

      if (!res.ok) {
        throw new Error(`Anikoto ${res.status}: ${url}`);
      }

      return (await res.json()) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      await sleep(800 * (attempt + 1));
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getRecentAnime(
  page = 1,
  perPage = 24,
  options: FetchOptions = { revalidate: 300 },
) {
  const url = `${BASE}/recent-anime?page=${page}&per_page=${perPage}`;
  const json = await fetchJson<RecentResponse>(url, options);

  if (!json.ok || !json.data) {
    throw new Error(json.error || "Failed to load recent anime");
  }

  return {
    anime: json.data,
    pagination: json.pagination!,
  };
}

export async function getSeries(
  id: number,
  options: FetchOptions = { revalidate: 180 },
) {
  const url = `${BASE}/series/${id}`;
  const json = await fetchJson<SeriesApiResponse>(url, options);

  if (!json.ok || !json.data) {
    throw new Error(json.error || "Series not found");
  }

  return json.data;
}

export function getGenres(anime: AnimeSummary): string[] {
  return anime.terms_by_type?.genre?.filter(Boolean) ?? [];
}

export function slugifyGenre(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function animeHref(anime: Pick<AnimeSummary, "id" | "slug">) {
  return `/anime/${anime.id}/${anime.slug}`;
}

export function watchHref(
  anime: Pick<AnimeSummary, "id" | "slug">,
  episode: number,
  lang: "sub" | "dub" = "sub",
) {
  return `/watch/${anime.id}/${anime.slug}?ep=${episode}&lang=${lang}`;
}
