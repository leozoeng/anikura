export type ProfileBadgeId = "dev" | "vip";

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
  /** Persisted public badges (e.g. dev, vip) */
  badges?: string[] | null;
};

export const DEFAULT_ACCENT_HEX = "#5865F2";

export const PROFILE_SELECT =
  "id, email, nickname, bio, avatar_url, banner_url, created_at, role, accent_hex, accent_ambient, badges";

/** Known badge ids, display order. */
export const PROFILE_BADGE_ORDER: ProfileBadgeId[] = ["dev", "vip"];

/**
 * Email → badges allowlist (reliable for staff even before DB seed).
 * Dev is also inferred from `role === "admin"`.
 */
const BADGE_EMAIL_ALLOWLIST: Record<string, ProfileBadgeId[]> = {
  "leozoeng@icloud.com": ["dev"],
};

function isKnownBadge(value: string): value is ProfileBadgeId {
  return value === "dev" || value === "vip";
}

/** Merge DB badges + email allowlist + admin role → ordered unique list. */
export function resolveProfileBadges(
  profile: Pick<PublicProfile, "email" | "role" | "badges">,
): ProfileBadgeId[] {
  const set = new Set<ProfileBadgeId>();

  for (const raw of profile.badges ?? []) {
    const id = String(raw).trim().toLowerCase();
    if (isKnownBadge(id)) set.add(id);
  }

  const email = profile.email?.trim().toLowerCase() ?? "";
  if (email && BADGE_EMAIL_ALLOWLIST[email]) {
    for (const id of BADGE_EMAIL_ALLOWLIST[email]) set.add(id);
  }

  if (profile.role === "admin") set.add("dev");

  return PROFILE_BADGE_ORDER.filter((id) => set.has(id));
}

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
