/**
 * Canonical public site origin for auth emails and redirects.
 * Prefer NEXT_PUBLIC_SITE_URL in production so confirm links never lean on localhost.
 */
export function getPublicSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (!/localhost|127\.0\.0\.1/i.test(origin)) return origin;
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(
    /\/$/,
    "",
  );
  if (vercel) return `https://${vercel}`;

  const vercelUrl = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercelUrl && !/localhost/i.test(vercelUrl)) {
    return `https://${vercelUrl}`;
  }

  return "https://anikura.club";
}

/** Absolute URL used as Supabase emailRedirectTo / callback. */
export function getAuthCallbackUrl(nextPath = "/"): string {
  const next =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  const url = new URL("/auth/callback", getPublicSiteUrl());
  if (next !== "/") url.searchParams.set("next", next);
  return url.toString();
}
