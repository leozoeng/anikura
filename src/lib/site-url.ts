/**
 * Canonical public site origin for auth emails and redirects.
 * Production / email links must never resolve to localhost.
 */
export const CANONICAL_SITE_URL = "https://anikura.club";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function isLoopbackHost(hostname: string): boolean {
  return /^(localhost|127\.0\.0\.1)$/i.test(hostname);
}

/**
 * Normalize a candidate origin. Returns null for empty, invalid, or loopback hosts
 * so callers can fall through to a public URL.
 */
export function toPublicOrigin(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  let value = raw.trim();
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (isLoopbackHost(url.hostname)) return null;
    return stripTrailingSlash(url.origin);
  } catch {
    return null;
  }
}

function isProductionDeploy(): boolean {
  if (process.env.VERCEL_ENV === "production") return true;
  if (process.env.VERCEL_ENV === "preview") return false;
  return process.env.NODE_ENV === "production";
}

/**
 * Public site origin for in-app redirects.
 * Ignores localhost even when NEXT_PUBLIC_SITE_URL is mis-set in production.
 */
export function getPublicSiteUrl(): string {
  const configured = toPublicOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured;

  if (typeof window !== "undefined") {
    const fromWindow = toPublicOrigin(window.location.origin);
    if (fromWindow) return fromWindow;
  }

  const vercelProd = toPublicOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelProd) return vercelProd;

  if (process.env.VERCEL_ENV === "preview") {
    const preview = toPublicOrigin(process.env.VERCEL_URL);
    if (preview) return preview;
  }

  if (isProductionDeploy()) return CANONICAL_SITE_URL;

  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

/**
 * Absolute URL used as Supabase emailRedirectTo / callback.
 * Always a public host — confirmation emails are opened on phones, not the
 * machine that signed up. Never falls back to localhost.
 */
export function getAuthCallbackUrl(nextPath = "/"): string {
  const next =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";

  const origin =
    toPublicOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    (typeof window !== "undefined"
      ? toPublicOrigin(window.location.origin)
      : null) ??
    toPublicOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    CANONICAL_SITE_URL;

  const url = new URL("/auth/callback", origin);
  if (next !== "/") url.searchParams.set("next", next);
  return url.toString();
}
