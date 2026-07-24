import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type SessionClaims = {
  sub?: string;
  email?: string;
  app_metadata?: {
    discord_verified?: boolean;
    discord_id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type SessionResult = {
  response: NextResponse;
  claims: SessionClaims | null;
};

/**
 * Refresh the auth session. Optionally rewrite the request URL
 * (e.g. `/@username` → `/u/username`) while keeping cookies intact.
 */
export async function updateSession(
  request: NextRequest,
  rewritePathname?: string,
): Promise<SessionResult> {
  const buildResponse = () => {
    if (rewritePathname) {
      const url = request.nextUrl.clone();
      url.pathname = rewritePathname;
      return NextResponse.rewrite(url, { request });
    }
    return NextResponse.next({ request });
  };

  let supabaseResponse = buildResponse();

  const env = getSupabaseEnv();
  if (!env) {
    return { response: supabaseResponse, claims: null };
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = buildResponse();
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  // Refresh session — validates JWT; do not use getSession() here.
  const { data } = await supabase.auth.getClaims();
  const claims = (data?.claims as SessionClaims | undefined) ?? null;

  return { response: supabaseResponse, claims };
}
