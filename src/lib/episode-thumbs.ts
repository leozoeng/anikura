import {
  buildEpisodeThumbnailMap,
  type AniListStreamingEpisode,
} from "@/lib/anilist";

type AniZipEpisode = {
  episodeNumber?: number;
  absoluteEpisodeNumber?: number;
  episode?: string;
  image?: string | null;
};

type AniZipResponse = {
  episodes?: Record<string, AniZipEpisode>;
};

/**
 * Episode scene stills from ani.zip (TVDB screencaps).
 * Fills gaps when AniList has no Crunchyroll streamingEpisodes.
 */
async function fetchAniZipThumbnails(
  aniListId: number,
): Promise<Record<number, string>> {
  const map: Record<number, string> = {};
  try {
    const res = await fetch(
      `https://api.ani.zip/mappings?anilist_id=${aniListId}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 * 60 * 12 },
      },
    );
    if (!res.ok) return map;
    const data = (await res.json()) as AniZipResponse;
    const episodes = data.episodes || {};

    for (const [key, ep] of Object.entries(episodes)) {
      const image = ep.image?.trim();
      if (!image) continue;

      const num =
        ep.absoluteEpisodeNumber ||
        ep.episodeNumber ||
        Number(ep.episode) ||
        Number(key);

      if (Number.isFinite(num) && num > 0) map[num] = image;
    }
  } catch {
    // Optional enrichment — ignore network/API failures.
  }
  return map;
}

/**
 * Prefer AniList/Crunchyroll streaming episode thumbs when present,
 * otherwise (and for missing eps) use ani.zip TVDB scene stills.
 */
export async function resolveEpisodeThumbnails(options: {
  aniListId?: number | null;
  streamingEpisodes?: AniListStreamingEpisode[] | null;
}): Promise<Record<number, string>> {
  const fromAniList = buildEpisodeThumbnailMap(options.streamingEpisodes);
  const aniListId = options.aniListId ? Number(options.aniListId) : 0;

  const fromZip =
    aniListId > 0 ? await fetchAniZipThumbnails(aniListId) : {};

  // AniList/Crunchyroll wins on conflict — usually sharper provider art.
  return { ...fromZip, ...fromAniList };
}
