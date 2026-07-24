import { type NextRequest, NextResponse } from "next/server";
import {
  isDiscordGateConfigured,
  skipsDiscordGate,
} from "@/lib/discord-gate";
import { vanityUsernameFromParam } from "@/lib/profile";
import {
  updateSession,
  type SessionClaims,
  type SessionResult,
} from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Normalize vanity pathnames. Some clients / CDNs send `/%40user` instead of `/@user`.
 * `nextUrl.pathname` may leave `%40` encoded — decode so the `/@…` rewrite still runs.
 */
export function vanityPathname(pathname: string): string {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    path = pathname;
  }
  // Literal "%40" that survived decoding (double-encoded or partial).
  if (path.startsWith("/%40")) {
    path = `/@${path.slice(4)}`;
  }
  return path;
}

/** High-frequency analytics — skip JWT refresh (saves Edge Requests + CPU). */
function skipAuthRefresh(pathname: string) {
  return (
    pathname === "/api/presence" ||
    pathname === "/api/watch-time" ||
    pathname.startsWith("/api/presence/") ||
    pathname.startsWith("/api/watch-time/")
  );
}

/** Always reachable without a session (auth shell + cron + static). */
function isPublicPath(pathname: string): boolean {
  if (
    pathname === "/login" ||
    pathname === "/auth/callback" ||
    pathname.startsWith("/auth/callback/") ||
    pathname === "/api/auth/signup" ||
    pathname === "/api/auth/confirm"
  ) {
    return true;
  }
  if (pathname === "/api/cron/catalog-sync") return true;
  return false;
}

/** Logged-in but not Discord-verified users may only hit these. */
function isDiscordOnboardingPath(pathname: string): boolean {
  return (
    pathname === "/join-discord" ||
    pathname.startsWith("/join-discord/") ||
    pathname === "/api/discord/verify" ||
    pathname.startsWith("/api/discord/") ||
    pathname === "/login" ||
    pathname === "/auth/callback" ||
    pathname.startsWith("/auth/callback/")
  );
}

function loginRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const next = `${pathname}${request.nextUrl.search}`;
  if (next && next !== "/") {
    url.searchParams.set("next", next);
  }
  return NextResponse.redirect(url);
}

function joinDiscordRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/join-discord";
  url.search = "";
  const next = `${pathname}${request.nextUrl.search}`;
  if (next && next !== "/join-discord") {
    url.searchParams.set("next", next.startsWith("/") ? next : "/");
  }
  return NextResponse.redirect(url);
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
  return to;
}

function isDiscordVerified(claims: SessionClaims | null): boolean {
  if (!claims) return false;
  if (claims.app_metadata?.discord_verified === true) return true;
  // Admins + explicit Discord bypass emails skip the gate.
  if (skipsDiscordGate(typeof claims.email === "string" ? claims.email : null)) {
    return true;
  }
  return false;
}

function applyAccessGate(
  request: NextRequest,
  session: SessionResult,
): NextResponse {
  const pathname = request.nextUrl.pathname;

  if (!isSupabaseConfigured()) {
    return session.response;
  }

  if (isPublicPath(pathname)) {
    return session.response;
  }

  const userId = typeof session.claims?.sub === "string" ? session.claims.sub : null;
  if (!userId) {
    return copyCookies(session.response, loginRedirect(request, pathname));
  }

  // Discord membership required when bot + guild are configured.
  // Existing accounts without app_metadata.discord_verified are blocked here
  // on every request (no grandfathering) until they complete /join-discord.
  if (isDiscordGateConfigured() && !isDiscordVerified(session.claims)) {
    if (isDiscordOnboardingPath(pathname)) {
      return session.response;
    }
    return copyCookies(
      session.response,
      joinDiscordRedirect(request, pathname),
    );
  }

  // Already verified — don't linger on the join page.
  if (
    pathname === "/join-discord" &&
    isDiscordVerified(session.claims)
  ) {
    const nextRaw = request.nextUrl.searchParams.get("next") || "/";
    const next =
      nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";
    const url = request.nextUrl.clone();
    url.pathname = next === "/join-discord" ? "/" : next;
    url.search = "";
    return copyCookies(session.response, NextResponse.redirect(url));
  }

  return session.response;
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Confirm emails used to land on Site URL + ?code= (often "/").
  // Forward those to the auth callback so production users aren't stuck.
  if (
    pathname === "/" &&
    searchParams.has("code") &&
    !searchParams.has("error")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // solo.to-style vanity: `/@username` → internal `/u/username`.
  // Do not use `app/@…` folders — those are Next.js parallel routes.
  // next.config.ts also rewrites these as a Vercel-safe backup.
  const atMatch = /^\/@([^/]+)$/.exec(vanityPathname(pathname));
  if (atMatch) {
    const handle = vanityUsernameFromParam(atMatch[1]);
    if (!handle) {
      // Invalid / reserved — still rewrite so `/u/[id]` can 404 cleanly.
      const fallback = atMatch[1]
        .trim()
        .replace(/^@+/, "")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 64);
      if (!fallback) {
        return NextResponse.rewrite(new URL("/u/__invalid__", request.url));
      }
      const session = await updateSession(request, `/u/${fallback}`);
      return applyAccessGate(request, session);
    }
    const session = await updateSession(request, `/u/${handle}`);
    return applyAccessGate(request, session);
  }

  if (skipAuthRefresh(pathname)) {
    // Still require a session cookie for analytics — no JWT round-trip.
    const hasSession = request.cookies
      .getAll()
      .some((c) => c.name.includes("auth-token") || c.name.includes("sb-"));
    if (!hasSession && isSupabaseConfigured()) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.next({ request });
  }

  const session = await updateSession(request);
  return applyAccessGate(request, session);
}

export const config = {
  matcher: [
    /*
     * Explicit vanity matchers first — `@` / `%40` paths must always hit proxy
     * even if the catch-all matcher semantics change across Next.js versions.
     */
    "/@:path*",
    "/%40:path*",
    /*
     * Skip static assets and high-frequency analytics APIs so they never
     * touch Supabase session refresh.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/presence|api/watch-time|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
