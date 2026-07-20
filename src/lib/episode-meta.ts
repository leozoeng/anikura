import {
  buildEpisodeThumbnailMap,
  decodeEntities,
  type AniListStreamingEpisode,
} from "@/lib/anilist";
import type { Episode } from "@/lib/types";

type AniZipTitle = string | { en?: string; ja?: string; "x-jat"?: string };

type AniZipEpisode = {
  episodeNumber?: number;
  absoluteEpisodeNumber?: number;
  episode?: string;
  image?: string | null;
  overview?: string | null;
  summary?: string | null;
  title?: AniZipTitle | null;
};

type AniZipResponse = {
  episodes?: Record<string, AniZipEpisode>;
};

export type EpisodeMetaMaps = {
  thumbnails: Record<number, string>;
  titles: Record<number, string>;
  descriptions: Record<number, string>;
};

function isGenericEpisodeTitle(title: string, number: number) {
  const t = title.trim();
  if (!t) return true;
  return new RegExp(`^episode\\s*0*${number}$`, "i").test(t);
}

function pickAniZipTitle(title: AniZipTitle | null | undefined) {
  if (!title) return "";
  if (typeof title === "string") return decodeEntities(title);
  return decodeEntities(
    title.en || title["x-jat"] || title.ja || "",
  );
}

function episodeNumberFromZip(key: string, ep: AniZipEpisode) {
  const candidates = [
    ep.episodeNumber,
    Number(ep.episode),
    Number(key),
    ep.absoluteEpisodeNumber,
  ];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return null;
}

function streamingEpisodeNumber(
  ep: AniListStreamingEpisode,
  index: number,
): number {
  const fromTitle = ep.title?.match(/(?:episode|ep\.?)\s*(\d+)/i);
  if (fromTitle) return Number(fromTitle[1]);
  return index + 1;
}

function streamingEpisodeTitle(ep: AniListStreamingEpisode) {
  const raw = decodeEntities(ep.title);
  if (!raw) return "";
  // "Episode 12 - Title" / "E12: Title" / "Ep. 12 Title"
  const stripped = raw
    .replace(/^(?:episode|ep\.?)\s*\d+\s*[-–:·.|]?\s*/i, "")
    .trim();
  return stripped || raw;
}

async function fetchAniZipEpisodes(
  aniListId: number,
): Promise<Record<string, AniZipEpisode>> {
  try {
    const res = await fetch(
      `https://api.ani.zip/mappings?anilist_id=${aniListId}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 * 60 * 12 },
      },
    );
    if (!res.ok) return {};
    const data = (await res.json()) as AniZipResponse;
    return data.episodes || {};
  } catch {
    return {};
  }
}

/**
 * Resolve scene thumbs, episode titles, and overviews from AniList
 * streamingEpisodes + ani.zip (TVDB). Prefer provider art / titles when present.
 */
export async function resolveEpisodeMeta(options: {
  aniListId?: number | null;
  streamingEpisodes?: AniListStreamingEpisode[] | null;
}): Promise<EpisodeMetaMaps> {
  const thumbnails: Record<number, string> = {};
  const titles: Record<number, string> = {};
  const descriptions: Record<number, string> = {};

  const streaming = options.streamingEpisodes || [];
  for (let i = 0; i < streaming.length; i++) {
    const ep = streaming[i];
    const num = streamingEpisodeNumber(ep, i);
    if (!Number.isFinite(num) || num <= 0) continue;

    const thumb = ep.thumbnail?.trim();
    if (thumb) thumbnails[num] = thumb;

    const title = streamingEpisodeTitle(ep);
    if (title && !isGenericEpisodeTitle(title, num)) {
      titles[num] = title;
    }
  }

  // Index-based AniList thumbs as fallback when title parsing missed a number
  const fromAniListIndex = buildEpisodeThumbnailMap(streaming);
  for (const [k, v] of Object.entries(fromAniListIndex)) {
    const num = Number(k);
    if (!thumbnails[num]) thumbnails[num] = v;
  }

  const aniListId = options.aniListId ? Number(options.aniListId) : 0;
  if (aniListId > 0) {
    const zipEps = await fetchAniZipEpisodes(aniListId);
    for (const [key, ep] of Object.entries(zipEps)) {
      const num = episodeNumberFromZip(key, ep);
      if (num == null) continue;

      const image = ep.image?.trim();
      if (image && !thumbnails[num]) thumbnails[num] = image;

      const title = pickAniZipTitle(ep.title);
      if (title && !isGenericEpisodeTitle(title, num) && !titles[num]) {
        titles[num] = title;
      }

      const overview = decodeEntities(ep.overview || ep.summary || "");
      if (overview && !descriptions[num]) {
        descriptions[num] = overview;
      }
    }
  }

  return { thumbnails, titles, descriptions };
}

/** Back-compat helper used by anime detail + watch pages. */
export async function resolveEpisodeThumbnails(options: {
  aniListId?: number | null;
  streamingEpisodes?: AniListStreamingEpisode[] | null;
}): Promise<Record<number, string>> {
  const meta = await resolveEpisodeMeta(options);
  return meta.thumbnails;
}

export function enrichEpisodesWithMeta(
  episodes: Episode[],
  titles: Record<number, string>,
): Episode[] {
  return episodes.map((ep) => {
    const decoded = decodeEntities(ep.title);
    if (decoded && !isGenericEpisodeTitle(decoded, ep.number)) {
      return { ...ep, title: decoded };
    }
    const enriched = titles[ep.number];
    if (enriched) return { ...ep, title: enriched };
    return { ...ep, title: decoded || `Episode ${ep.number}` };
  });
}

export function episodeDisplayTitle(ep: Pick<Episode, "title" | "number">) {
  const raw = decodeEntities(ep.title);
  if (raw && !isGenericEpisodeTitle(raw, ep.number)) return raw;
  return `Episode ${ep.number}`;
}

export function isGenericTitle(title: string, number: number) {
  return isGenericEpisodeTitle(decodeEntities(title), number);
}
