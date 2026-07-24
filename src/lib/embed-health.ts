import { getPublicSiteUrl } from "@/lib/site-url";

const FAILURE_PATTERNS = [
  /error code:\s*410/i,
  /error code:\s*404/i,
  /oops!\s*something went wrong/i,
  /error - megaplay/i,
  /we're sorry/i,
  /content removed/i,
  /can't find the file/i,
  /cannot find the file/i,
  /copyright violation/i,
  /file you are looking for/i,
  /no input file specified/i,
  /route not found/i,
  /404 not found/i,
  /"success"\s*:\s*false/i,
];

const SUCCESS_HINTS = [
  /jwplayer/i,
  /artplayer/i,
  /hls\.js/i,
  /m3u8/i,
  /<video/i,
  /plyr/i,
  /videolink/i,
  /videasy/i,
  /vidsrc/i,
  /player\.js/i,
  /e1-player/i,
  /file \d+ - megaplay/i,
];

const ALLOWED_HOSTS = new Set([
  "megaplay.buzz",
  "supaplay.fun",
  "player.videasy.to",
  "player.videasy.net",
  "vidsrc.pm",
  "www.vidsrc.pm",
]);

export type EmbedCheckResult = {
  ok: boolean;
  status: number | null;
  reason: string;
};

export function isAllowedEmbedUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      ALLOWED_HOSTS.has(url.hostname)
    );
  } catch {
    return false;
  }
}

function siteReferer(): string {
  try {
    return `${getPublicSiteUrl()}/`;
  } catch {
    return "https://anikura.club/";
  }
}

/** MegaPlay /stream/s-2/{fileId}/{lang} → probe getSources (needs AJAX + Referer). */
function megaPlayFileId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (
      url.hostname !== "megaplay.buzz" &&
      url.hostname !== "supaplay.fun"
    ) {
      return null;
    }
    const match = url.pathname.match(/\/stream\/s-\d+\/(\d+)\//i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function checkMegaPlaySources(fileId: string): Promise<EmbedCheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const url = `https://megaplay.buzz/stream/getSources?id=${encodeURIComponent(fileId)}&lang=sub`;

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/plain, */*",
        "X-Requested-With": "XMLHttpRequest",
        Referer: siteReferer(),
        "User-Agent":
          "Mozilla/5.0 (compatible; AnikuraBot/1.0; +https://anikura.club)",
      },
      cache: "no-store",
    });

    if (res.status === 404 || res.status === 410) {
      return { ok: false, status: res.status, reason: `http_${res.status}` };
    }

    const text = await res.text();
    if (FAILURE_PATTERNS.some((p) => p.test(text))) {
      return { ok: false, status: res.status, reason: "error_page" };
    }

    try {
      const json = JSON.parse(text) as {
        sources?: { file?: string };
        error?: string;
      };
      if (json.error) {
        return { ok: false, status: res.status, reason: "api_error" };
      }
      if (json.sources?.file && /m3u8|mp4/i.test(json.sources.file)) {
        return { ok: true, status: res.status, reason: "ok_sources" };
      }
      return { ok: false, status: res.status, reason: "no_sources" };
    } catch {
      return { ok: false, status: res.status, reason: "invalid_json" };
    }
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      status: null,
      reason: aborted ? "timeout" : "fetch_failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkEmbedUrl(rawUrl: string): Promise<EmbedCheckResult> {
  if (!isAllowedEmbedUrl(rawUrl)) {
    return { ok: false, status: null, reason: "host_not_allowed" };
  }

  const fileId = megaPlayFileId(rawUrl);
  if (fileId) {
    return checkMegaPlaySources(fileId);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(rawUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        Referer: siteReferer(),
        "User-Agent":
          "Mozilla/5.0 (compatible; AnikuraBot/1.0; +https://anikura.club)",
      },
      cache: "no-store",
    });

    const status = res.status;
    if (status === 404 || status === 410 || status === 451) {
      return { ok: false, status, reason: `http_${status}` };
    }
    if (status >= 500) {
      return { ok: false, status, reason: `http_${status}` };
    }
    if (status === 403) {
      // Some CDNs block bots — treat as unknown/usable rather than hard fail
      return { ok: true, status, reason: "http_403_soft" };
    }

    const text = (await res.text()).slice(0, 80_000);

    for (const pattern of FAILURE_PATTERNS) {
      if (pattern.test(text)) {
        return { ok: false, status, reason: "error_page" };
      }
    }

    // Empty or tiny error shells
    if (text.trim().length < 40) {
      return { ok: false, status, reason: "empty_body" };
    }

    const hasSuccessHint = SUCCESS_HINTS.some((p) => p.test(text));
    if (status >= 200 && status < 400) {
      return {
        ok: true,
        status,
        reason: hasSuccessHint ? "ok_player" : "ok",
      };
    }

    return { ok: false, status, reason: `http_${status}` };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      status: null,
      reason: aborted ? "timeout" : "fetch_failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

export type ServerProbe = {
  id: string;
  url: string;
};

export type ServerProbeResult = ServerProbe & EmbedCheckResult;

export async function resolveBestServer(
  servers: ServerProbe[],
  preferredId?: string | null,
): Promise<{
  best: ServerProbeResult | null;
  results: ServerProbeResult[];
}> {
  const results = await Promise.all(
    servers.map(async (server) => {
      const check = await checkEmbedUrl(server.url);
      return { ...server, ...check };
    }),
  );

  if (preferredId) {
    const preferred = results.find((r) => r.id === preferredId && r.ok);
    if (preferred) return { best: preferred, results };
  }

  // Prefer providers that passed a strong check.
  const ranked = [...results].sort((a, b) => {
    const score = (r: ServerProbeResult) => {
      if (!r.ok) return 0;
      if (r.reason === "ok_sources" || r.reason === "ok_player") return 3;
      if (r.reason === "ok") return 2;
      return 1;
    };
    return score(b) - score(a);
  });

  const best = ranked.find((r) => r.ok) ?? null;
  return { best, results };
}
