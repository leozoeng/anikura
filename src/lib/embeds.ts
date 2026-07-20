import type { AnimeSummary, Episode } from "./types";

export type EmbedServerId = "megaplay" | "supaplay" | "megaplay-mal" | "megaplay-ani";

export type EmbedServer = {
  id: EmbedServerId;
  label: string;
  url: string;
};

type BuildArgs = {
  anime: AnimeSummary;
  episode: Episode;
  language: "sub" | "dub";
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

export function buildEmbedServers({
  anime,
  episode,
  language,
}: BuildArgs): EmbedServer[] {
  const servers: EmbedServer[] = [];
  const aniId = anime.ani_id?.trim();
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
