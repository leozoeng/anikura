import type { AnimeSummary, Episode } from "./types";

export type EmbedServerId =
  | "megaplay"
  | "supaplay"
  | "videasy"
  | "vidsrc"
  | "megaplay-mal"
  | "megaplay-ani";

export type EmbedServer = {
  id: EmbedServerId;
  label: string;
  url: string;
};

type BuildArgs = {
  anime: AnimeSummary;
  episode: Episode;
  language: "sub" | "dub";
  /** Prefer resolved AniList id when catalog `ani_id` is missing/wrong. */
  aniListId?: number | string | null;
};

function rewriteHost(url: string | undefined, host: string) {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.hostname = host;
    return u.toString();
  } catch {
    return null;
  }
}

function pickAniId(anime: AnimeSummary, aniListId?: number | string | null) {
  const fromArg =
    aniListId != null && String(aniListId).trim() !== ""
      ? String(aniListId).trim()
      : null;
  const fromAnime = anime.ani_id?.trim() || null;
  // Ignore bogus rows where ani_id was copied from MAL.
  if (
    fromAnime &&
    anime.mal_id?.trim() &&
    fromAnime === anime.mal_id.trim() &&
    fromArg
  ) {
    return fromArg;
  }
  return fromArg || fromAnime;
}

export function buildEmbedServers({
  anime,
  episode,
  language,
  aniListId,
}: BuildArgs): EmbedServer[] {
  const servers: EmbedServer[] = [];
  const aniId = pickAniId(anime, aniListId);
  const malId = anime.mal_id?.trim();
  const embedId = episode.episode_embed_id;

  const megaFromApi =
    language === "dub"
      ? episode.embed_url?.dub || episode.embed_url?.sub
      : episode.embed_url?.sub || episode.embed_url?.dub;

  if (megaFromApi || embedId) {
    const mega =
      megaFromApi ||
      `https://megaplay.buzz/stream/s-2/${embedId}/${language}`;
    servers.push({ id: "megaplay", label: "MegaPlay", url: mega });

    const supa =
      rewriteHost(mega, "supaplay.fun") ||
      `https://supaplay.fun/stream/s-2/${embedId}/${language}`;
    servers.push({ id: "supaplay", label: "SupaPlay", url: supa });
  }

  // AniList / MAL players survive when HiAnime-era MegaPlay file ids go stale.
  if (aniId) {
    servers.push({
      id: "videasy",
      label: "Videasy",
      url: `https://player.videasy.to/anime/${aniId}/${episode.number}?dub=${
        language === "dub" ? "true" : "false"
      }`,
    });
    servers.push({
      id: "vidsrc",
      label: "VidSrc",
      url: `https://vidsrc.pm/embed/anime/${aniId}/${episode.number}`,
    });
  } else if (malId) {
    servers.push({
      id: "vidsrc",
      label: "VidSrc",
      url: `https://vidsrc.pm/embed/anime?mal=${malId}&ep=${episode.number}`,
    });
  }

  if (malId) {
    servers.push({
      id: "megaplay-mal",
      label: "MegaPlay MAL",
      url: `https://megaplay.buzz/stream/mal/${malId}/${episode.number}/${language}`,
    });
  }

  if (aniId) {
    servers.push({
      id: "megaplay-ani",
      label: "MegaPlay Ani",
      url: `https://megaplay.buzz/stream/ani/${aniId}/${episode.number}/${language}`,
    });
  }

  // de-dupe by URL
  const seen = new Set<string>();
  return servers.filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

export function pickDefaultServer(
  servers: EmbedServer[],
  preferred?: string | null,
): EmbedServer | null {
  if (!servers.length) return null;
  if (preferred) {
    const match = servers.find((s) => s.id === preferred);
    if (match) return match;
  }
  return servers[0];
}
