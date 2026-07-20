const FAILURE_PATTERNS = [
  /error code:\s*410/i,
  /we're sorry/i,
  /content removed/i,
  /can't find the file/i,
  /cannot find the file/i,
  /copyright violation/i,
  /file you are looking for/i,
  /no input file specified/i,
  /route not found/i,
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
  /player\.js/i,
  /embed/i,
];

const ALLOWED_HOSTS = new Set([
  "megaplay.buzz",
  "www.megaplay.buzz",
  "supaplay.fun",
  "www.supaplay.fun",
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

export async function checkEmbedUrl(rawUrl: string): Promise<EmbedCheckResult> {
  if (!isAllowedEmbedUrl(rawUrl)) {
    return { ok: false, status: null, reason: "host_not_allowed" };
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
        "User-Agent":
          "Mozilla/5.0 (compatible; AnikuraBot/1.0; +https://localhost)",
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

  const best = results.find((r) => r.ok) ?? null;
  return { best, results };
}
