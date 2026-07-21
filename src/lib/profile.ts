export type ProfileBadgeId = "dev" | "vip" | "og" | "partner";

export type PublicProfile = {
  id: string;
  email: string | null;
  /** Unique vanity handle (lowercase a-z0-9_). */
  username?: string | null;
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
  "id, email, username, nickname, bio, avatar_url, banner_url, created_at, role, accent_hex, accent_ambient, badges";

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 24;
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/** Keep in sync with `private.is_reserved_username` in Supabase migrations. */
export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "anikura",
  "api",
  "auth",
  "browse",
  "callback",
  "discord",
  "genres",
  "ghibli",
  "help",
  "home",
  "login",
  "logout",
  "me",
  "mod",
  "moderator",
  "null",
  "official",
  "onepiece",
  "owner",
  "profile",
  "profiles",
  "root",
  "search",
  "settings",
  "shinkai",
  "signup",
  "social",
  "staff",
  "support",
  "system",
  "undefined",
  "u",
  "user",
  "users",
  "watch",
  "www",
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Known badge ids, display order. */
export const PROFILE_BADGE_ORDER: ProfileBadgeId[] = [
  "og",
  "partner",
  "dev",
  "vip",
];

/**
 * Email → badges allowlist (reliable for staff even before DB seed).
 * Dev is also inferred from `role === "admin"`.
 */
const BADGE_EMAIL_ALLOWLIST: Record<string, ProfileBadgeId[]> = {
  "leozoeng@icloud.com": ["dev"],
};

function isKnownBadge(value: string): value is ProfileBadgeId {
  return (
    value === "dev" ||
    value === "vip" ||
    value === "og" ||
    value === "partner"
  );
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
  profile: Pick<PublicProfile, "nickname" | "username" | "email">,
) {
  return (
    profile.nickname?.trim() ||
    profile.username?.trim() ||
    profile.email?.split("@")[0] ||
    "Viewer"
  );
}

/** Normalize vanity username input → lowercase handle or null if invalid. */
export function normalizeUsername(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  if (cleaned.length < USERNAME_MIN || cleaned.length > USERNAME_MAX) return null;
  if (!USERNAME_PATTERN.test(cleaned)) return null;
  return cleaned;
}

export function isReservedUsername(handle: string) {
  return RESERVED_USERNAMES.has(handle.toLowerCase());
}

/**
 * Valid public vanity handle for routing (normalized + not reserved).
 * Reserved/invalid → null (caller should 404).
 */
export function vanityUsernameFromParam(
  raw: string | null | undefined,
): string | null {
  const handle = normalizeUsername(raw);
  if (!handle || isReservedUsername(handle)) return null;
  return handle;
}

export function isProfileUuid(value: string) {
  return UUID_RE.test(value.trim());
}

export function handleFromProfile(
  profile: Pick<PublicProfile, "username" | "nickname" | "email">,
) {
  const base =
    normalizeUsername(profile.username) ||
    normalizeUsername(profile.nickname) ||
    profile.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ||
    "viewer";
  return `@${base}`;
}

/** Prefer solo.to-style `/@username`, fall back to UUID permalink. */
export function profileHref(
  profile: Pick<PublicProfile, "id" | "username">,
) {
  const handle = vanityUsernameFromParam(profile.username);
  return handle ? `/@${handle}` : `/u/${profile.id}`;
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
