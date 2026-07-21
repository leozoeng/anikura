import { type NextRequest, NextResponse } from "next/server";
import { vanityUsernameFromParam } from "@/lib/profile";
import { updateSession } from "@/lib/supabase/middleware";

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
  const atMatch = /^\/@([^/]+)$/.exec(pathname);
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
      return updateSession(request, `/u/${fallback}`);
    }
    return updateSession(request, `/u/${handle}`);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
