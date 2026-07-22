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

export type AniListRelationNode = {
  id: number;
  idMal?: number | null;
  type?: string | null;
  format?: string | null;
  title: AniListTitle;
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
  } | null;
  seasonYear?: number | null;
  averageScore?: number | null;
};

export type AniListCharacterEdge = {
  role?: string | null;
  node?: {
    id: number;
    name?: {
      full?: string | null;
      native?: string | null;
    } | null;
    image?: { large?: string | null } | null;
  } | null;
  voiceActors?: {
    id: number;
    name?: {
      full?: string | null;
      native?: string | null;
    } | null;
    image?: { large?: string | null } | null;
  }[] | null;
};

export type AniListMedia = {
  id: number;
  idMal?: number | null;
  title: AniListTitle;
  description?: string | null;
  episodes?: number | null;
  status?: string | null;
  season?: string | null;
  seasonYear?: number | null;
  averageScore?: number | null;
  genres?: string[];
  source?: string | null;
  startDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  endDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
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
  characters?: {
    edges?: AniListCharacterEdge[] | null;
  } | null;
  recommendations?: {
    nodes?: {
      mediaRecommendation?: {
        id: number;
        idMal?: number | null;
        title: AniListTitle;
        coverImage?: {
          extraLarge?: string | null;
          large?: string | null;
        } | null;
        averageScore?: number | null;
        seasonYear?: number | null;
        format?: string | null;
      } | null;
    }[];
  } | null;
  relations?: {
    edges?: {
      relationType?: string | null;
      node?: AniListRelationNode | null;
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
  format
  season
  seasonYear
  averageScore
  genres
  source
  startDate { year month day }
  endDate { year month day }
  bannerImage
  coverImage { extraLarge large color }
  trailer { id site thumbnail }
  streamingEpisodes { title thumbnail url site }
  studios(isMain: true) { nodes { name } }
`;

const CHARACTER_FIELDS = `
  characters(page: 1, perPage: 18, sort: ROLE) {
    edges {
      role
      node {
        id
        name { full native }
        image { large }
      }
      voiceActors(language: JAPANESE, sort: RELEVANCE) {
        id
        name { full native }
        image { large }
      }
    }
  }
`;

/** Humanize AniList / catalog status strings for UI pills. */
export function formatMediaStatus(status?: string | null) {
  if (!status) return null;
  const key = status.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const labels: Record<string, string> = {
    FINISHED: "Finished Airing",
    FINISHED_AIRING: "Finished Airing",
    RELEASING: "Currently Airing",
    CURRENTLY_AIRING: "Currently Airing",
    NOT_YET_RELEASED: "Not Yet Aired",
    NOT_YET_AIRED: "Not Yet Aired",
    CANCELLED: "Cancelled",
    HIATUS: "Hiatus",
  };
  if (labels[key]) return labels[key];
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatFuzzyDate(date?: {
  year?: number | null;
  month?: number | null;
  day?: number | null;
} | null) {
  if (!date?.year) return null;
  const month = date.month ? MONTHS[date.month - 1] : null;
  if (month && date.day) return `${month} ${date.day}, ${date.year}`;
  if (month) return `${month} ${date.year}`;
  return String(date.year);
}

/** Compact aired range from catalog string or AniList start/end dates. */
export function formatAiredRange(
  catalogAired?: string | null,
  media?: Pick<AniListMedia, "startDate" | "endDate"> | null,
) {
  const fromCatalog = catalogAired?.replace(/&nbsp;?/gi, " ").trim();
  if (fromCatalog && fromCatalog !== "&nbsp") {
    return fromCatalog.replace(/\s+to\s+/i, " – ");
  }
  const start = formatFuzzyDate(media?.startDate);
  const end = formatFuzzyDate(media?.endDate);
  if (start && end && start !== end) return `${start} – ${end}`;
  return start || end || null;
}

export function formatMediaLabel(value?: string | null) {
  if (!value) return null;
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

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
        ${CHARACTER_FIELDS}
        relations {
          edges {
            relationType
            node {
              id
              idMal
              type
              format
              title { romaji english native }
              coverImage { extraLarge large }
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
              coverImage { extraLarge large }
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

/** Resolve AniList media when we only have a MyAnimeList id. */
export async function getAniListMediaByMal(malId: number) {
  if (!Number.isFinite(malId) || malId <= 0) return null;
  const data = await anilistFetch<{ Media: AniListMedia | null }>(
    `query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        ${MEDIA_FIELDS}
        format
        ${CHARACTER_FIELDS}
        relations {
          edges {
            relationType
            node {
              id
              idMal
              type
              format
              title { romaji english native }
              coverImage { extraLarge large }
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
              coverImage { extraLarge large }
              averageScore
              seasonYear
              format
            }
          }
        }
      }
    }`,
    { idMal: malId },
  );
  return data?.Media ?? null;
}

export async function resolveAniListForAnime(anime: {
  ani_id?: string | null;
  mal_id?: string | null;
}) {
  const aniId = Number(anime.ani_id) || 0;
  if (aniId) {
    const media = await getAniListMedia(aniId);
    if (media) return media;
  }
  const malId = Number(anime.mal_id) || 0;
  if (malId) return getAniListMediaByMal(malId);
  return null;
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

/** Lightweight batch fetch of PREQUEL/SEQUEL (etc.) edges for franchise walking. */
export async function getAniListRelationGraphs(ids: number[]) {
  const unique = [...new Set(ids.filter((n) => Number.isFinite(n) && n > 0))];
  if (!unique.length) {
    return [] as {
      id: number;
      relations?: AniListMedia["relations"];
    }[];
  }

  const data = await anilistFetch<{
    Page: {
      media: {
        id: number;
        relations?: AniListMedia["relations"];
      }[];
    };
  }>(
    `query ($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(id_in: $ids, type: ANIME) {
          id
          relations {
            edges {
              relationType
              node {
                id
                idMal
                type
                format
                title { romaji english native }
                coverImage { extraLarge large }
                seasonYear
                averageScore
              }
            }
          }
        }
      }
    }`,
    { ids: unique.slice(0, 50) },
    600,
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
          format
          averageScore
          seasonYear
          coverImage { extraLarge large }
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
  // AniList seasons: Winter Dec–Feb, Spring Mar–May, Summer Jun–Aug, Fall Sep–Nov.
  // Winter's seasonYear is the January year (Dec 2025 → Winter 2026).
  const month = now.getUTCMonth(); // 0–11
  let season: "WINTER" | "SPRING" | "SUMMER" | "FALL";
  let year = now.getUTCFullYear();
  if (month === 11) {
    season = "WINTER";
    year += 1;
  } else if (month <= 1) {
    season = "WINTER";
  } else if (month <= 4) {
    season = "SPRING";
  } else if (month <= 7) {
    season = "SUMMER";
  } else {
    season = "FALL";
  }

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
