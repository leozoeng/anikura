export type PublicProfile = {
  id: string;
  email: string | null;
  nickname: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
  role?: "user" | "admin";
  /** Hex accent for avatar glow / card tint, e.g. #5865F2 */
  accent_hex?: string | null;
  /** Soft ambient wash derived from accent_hex */
  accent_ambient?: boolean | null;
};

export const DEFAULT_ACCENT_HEX = "#5865F2";

export const PROFILE_SELECT =
  "id, email, nickname, bio, avatar_url, banner_url, created_at, role, accent_hex, accent_ambient";

export function displayName(
  profile: Pick<PublicProfile, "nickname" | "email">,
) {
  return (
    profile.nickname?.trim() ||
    profile.email?.split("@")[0] ||
    "Viewer"
  );
}

export function handleFromProfile(
  profile: Pick<PublicProfile, "nickname" | "email">,
) {
  const base =
    profile.nickname?.trim() ||
    profile.email?.split("@")[0] ||
    "viewer";
  return `@${base.toLowerCase().replace(/\s+/g, "")}`;
}

/** Normalize user input to #RRGGBB or null if invalid. */
export function normalizeAccentHex(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(withHash)) return null;
  return withHash.toUpperCase();
}

export function resolveAccentHex(profile: Pick<PublicProfile, "accent_hex">) {
  return (
    normalizeAccentHex(profile.accent_hex) ?? DEFAULT_ACCENT_HEX
  );
}

export function accentAmbientEnabled(
  profile: Pick<PublicProfile, "accent_ambient">,
) {
  return profile.accent_ambient !== false;
}

/** Convert #RRGGBB to "r, g, b" for rgba() CSS. */
export function hexToRgbChannels(hex: string): string {
  const h = normalizeAccentHex(hex) ?? DEFAULT_ACCENT_HEX;
  const n = parseInt(h.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `${r}, ${g}, ${b}`;
}

export function formatMemberSince(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
