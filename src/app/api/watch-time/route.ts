import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type WatchBody = {
  sessionId?: string;
  seconds?: number;
  path?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "unconfigured" }, { status: 503 });
  }

  let body: WatchBody;
  try {
    body = (await request.json()) as WatchBody;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim() ?? "";
  const seconds = Math.round(Number(body.seconds));
  if (sessionId.length < 8) {
    return NextResponse.json({ ok: false, reason: "bad_session" }, { status: 400 });
  }
  if (!Number.isFinite(seconds) || seconds < 1 || seconds > 300) {
    return NextResponse.json({ ok: false, reason: "bad_seconds" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("track_watch_time", {
    p_session_id: sessionId,
    p_seconds: seconds,
    p_path: body.path ?? null,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, reason: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
