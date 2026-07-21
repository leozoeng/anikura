import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPublicSiteUrl, toPublicOrigin } from "@/lib/site-url";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function redirectBase(request: Request): string {
  // Prefer the host the user actually hit (apex vs www); never stay on localhost.
  return toPublicOrigin(new URL(request.url).origin) ?? getPublicSiteUrl();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") || "/";
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";
  const site = redirectBase(request);

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=auth", site));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, site),
    );
  }

  return NextResponse.redirect(new URL(next, site));
}
