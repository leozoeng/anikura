import { NextResponse } from "next/server";
import { resolveRequestGeo } from "@/lib/geo";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type PresenceBody = {
  sessionId?: string;
  path?: string;
  trackPageView?: boolean;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "unconfigured" }, { status: 503 });
  }

  let body: PresenceBody;
  try {
    body = (await request.json()) as PresenceBody;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim() ?? "";
  if (sessionId.length < 8) {
    return NextResponse.json({ ok: false, reason: "bad_session" }, { status: 400 });
  }

  const geo = await resolveRequestGeo(request);
  const supabase = await createClient();

  const { error } = await supabase.rpc("upsert_presence", {
    p_session_id: sessionId,
    p_lat: geo.lat,
    p_lng: geo.lng,
    p_country: geo.country,
    p_city: geo.city,
    p_path: body.path ?? null,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, reason: error.message },
      { status: 500 },
    );
  }

  if (body.trackPageView) {
    await supabase.rpc("track_event", {
      p_event_type: "page_view",
      p_path: body.path ?? null,
      p_session_id: sessionId,
    });
  }

  return NextResponse.json({ ok: true });
}
