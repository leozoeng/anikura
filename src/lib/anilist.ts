export type AniListTitle = {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
};

export type AniListTrailer = {
  id: string;
  site: string;
  thumbnail?: string | null;
};

export type AniListStreamingEpisode = {
  title?: string | null;
  thumbnail?: string | null;
  url?: string | null;
  site?: string | null;
};

export type AniListMedia = {
  id: number;
  idMal?: number | null;
  title: AniListTitle;
  description?: string | null;
  episodes?: number | null;
  status?: string | null;
  seasonYear?: number | null;
  averageScore?: number | null;
  genres?: string[];
  bannerImage?: string | null;
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
    color?: string | null;
  } | null;
  trailer?: AniListTrailer | null;
  streamingEpisodes?: AniListStreamingEpisode[] | null;
  studios?: {
    nodes?: { name: string }[];
  } | null;
  format?: string | null;
  recommendations?: {
    nodes?: {
      mediaRecommendation?: {
        id: number;
        idMal?: number | null;
        title: AniListTitle;
        coverImage?: { large?: string | null } | null;
        averageScore?: number | null;
        seasonYear?: number | null;
        format?: string | null;
      } | null;
    }[];
  } | null;
  relations?: {
    edges?: {
      relationType?: string | null;
      node?: {
        id: number;
        idMal?: number | null;
        type?: string | null;
        format?: string | null;
        title: AniListTitle;
        coverImage?: { large?: string | null } | null;
        seasonYear?: number | null;
        averageScore?: number | null;
      } | null;
    }[];
  } | null;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

const ENDPOINT = "https://graphql.anilist.co";

async function anilistFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  revalidate = 600,
): Promise<T | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate },
    });

    if (!res.ok) return null;
    const json = (await res.json()) as GraphQLResponse<T>;
    if (json.errors?.length) return null;
    return json.data ?? null;
  } catch {
    return null;
  }
}

const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english native }
  description(asHtml: false)
  episodes
  status
  seasonYear
  averageScore
  genres
  bannerImage
  coverImage { extraLarge large color }
  trailer { id site thumbnail }
  streamingEpisodes { title thumbnail url site }
  studios(isMain: true) { nodes { name } }
`;

export function stripHtml(html?: string | null) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

export function decodeEntities(text?: string | null) {
  return stripHtml(text);
}


export function displayTitle(title: AniListTitle) {
  return title.english || title.romaji || title.native || "Untitled";
}

/** Map episode numbers to AniList streaming episode thumbnails when available. */
export function buildEpisodeThumbnailMap(
  streamingEpisodes?: AniListStreamingEpisode[] | null,
): Record<number, string> {
  const map: Record<number, string> = {};
  if (!streamingEpisodes?.length) return map;

  for (let i = 0; i < streamingEpisodes.length; i++) {
    const ep = streamingEpisodes[i];
    const thumb = ep.thumbnail?.trim();
    if (!thumb) continue;

    map[i + 1] = thumb;

    const fromTitle = ep.title?.match(/(?:episode|ep\.?)\s*(\d+)/i);
    if (fromTitle) map[Number(fromTitle[1])] = thumb;
  }

  return map;
}

export function youtubeEmbedUrl(trailerId: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
    loop: "1",
    playlist: trailerId,
    enablejsapi: "1",
    iv_load_policy: "3",
    disablekb: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${trailerId}?${params}`;
}

export async function getAniListMedia(id: number) {
  const data = await anilistFetch<{ Media: AniListMedia | null }>(
    `query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
        format
        relations {
          edges {
            relationType
            node {
              id
              idMal
              type
              format
              title { romaji english native }
              coverImage { large }
              seasonYear
              averageScore
            }
          }
        }
        recommendations(page: 1, perPage: 25, sort: RATING_DESC) {
          nodes {
            mediaRecommendation {
              id
              idMal
              title { romaji english }
              coverImage { large }
              averageScore
              seasonYear
              format
            }
          }
        }
      }
    }`,
    { id },
  );
  return data?.Media ?? null;
}

export async function getAniListByIds(ids: number[]) {
  const unique = [...new Set(ids.filter((n) => Number.isFinite(n) && n > 0))];
  if (!unique.length) return [] as AniListMedia[];

  const data = await anilistFetch<{
    Page: { media: AniListMedia[] };
  }>(
    `query ($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(id_in: $ids, type: ANIME) {
          ${MEDIA_FIELDS}
        }
      }
    }`,
    { ids: unique.slice(0, 50) },
    300,
  );

  return data?.Page?.media ?? [];
}

export async function searchAniList(query: string, perPage = 8) {
  const q = query.trim();
  if (!q) return [] as AniListMedia[];

  const data = await anilistFetch<{
    Page: { media: AniListMedia[] };
  }>(
    `query ($search: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
          id
          idMal
          title { romaji english native }
          averageScore
          seasonYear
          coverImage { large }
          genres
        }
      }
    }`,
    { search: q, perPage },
    60,
  );

  return data?.Page?.media ?? [];
}

export async function getTrendingAnime(perPage = 18) {
  const data = await anilistFetch<{
    Page: { media: AniListMedia[] };
  }>(
    `query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }`,
    { perPage },
    300,
  );
  return data?.Page?.media ?? [];
}

export async function getPopularThisSeason(perPage = 18) {
  const now = new Date();
  const month = now.getUTCMonth();
  const season =
    month <= 2 ? "WINTER" : month <= 5 ? "SPRING" : month <= 8 ? "SUMMER" : "FALL";
  const year = now.getUTCFullYear();

  const data = await anilistFetch<{
    Page: { media: AniListMedia[] };
  }>(
    `query ($season: MediaSeason, $year: Int, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(
          type: ANIME
          season: $season
          seasonYear: $year
          sort: POPULARITY_DESC
          isAdult: false
        ) {
          ${MEDIA_FIELDS}
        }
      }
    }`,
    { season, year, perPage },
    300,
  );
  return data?.Page?.media ?? [];
}
