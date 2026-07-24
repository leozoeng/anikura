import { NextRequest, NextResponse } from "next/server";
import {
  checkEmbedUrl,
  isAllowedEmbedUrl,
  resolveBestServer,
  type ServerProbe,
} from "@/lib/embed-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  url?: string;
  servers?: ServerProbe[];
  preferredId?: string | null;
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; payload: unknown }>();

function cacheGet(key: string): unknown | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.payload;
}

function cacheSet(key: string, payload: unknown) {
  cache.set(key, { at: Date.now(), payload });
  // Bound memory — drop oldest when oversized.
  if (cache.size > 200) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.servers && Array.isArray(body.servers)) {
    if (body.servers.length === 0) {
      return NextResponse.json({ best: null, results: [] });
    }
    if (body.servers.length > 8) {
      return NextResponse.json({ error: "too_many_servers" }, { status: 400 });
    }
    for (const server of body.servers) {
      if (!server?.id || !server?.url || !isAllowedEmbedUrl(server.url)) {
        return NextResponse.json({ error: "invalid_server" }, { status: 400 });
      }
    }

    const key = `servers:${body.preferredId ?? ""}:${body.servers
      .map((s) => `${s.id}|${s.url}`)
      .join(";")}`;
    const cached = cacheGet(key);
    if (cached) return NextResponse.json(cached);

    const resolved = await resolveBestServer(body.servers, body.preferredId);
    cacheSet(key, resolved);
    return NextResponse.json(resolved);
  }

  if (body.url) {
    if (!isAllowedEmbedUrl(body.url)) {
      return NextResponse.json({ error: "host_not_allowed" }, { status: 400 });
    }
    const key = `url:${body.url}`;
    const cached = cacheGet(key);
    if (cached) return NextResponse.json(cached);

    const result = await checkEmbedUrl(body.url);
    cacheSet(key, result);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "missing_payload" }, { status: 400 });
}
