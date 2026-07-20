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

    const resolved = await resolveBestServer(body.servers, body.preferredId);
    return NextResponse.json(resolved);
  }

  if (body.url) {
    if (!isAllowedEmbedUrl(body.url)) {
      return NextResponse.json({ error: "host_not_allowed" }, { status: 400 });
    }
    const result = await checkEmbedUrl(body.url);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "missing_payload" }, { status: 400 });
}
