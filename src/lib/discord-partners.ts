/**
 * Discord communities that trust Anikura.
 * Easy to extend later (admin-managed table / CMS) — keep this shape stable.
 *
 * Swap placeholder invite URLs and icons when real partner servers are confirmed.
 */

export type DiscordPartner = {
  id: string;
  name: string;
  /** Local `/public` path or remote URL */
  iconUrl: string;
  memberCount: number;
  inviteUrl: string;
  /** Highlight in the rail (optional) */
  featured?: boolean;
};

/** Matches footer / header Anikura Discord invite. */
export const ANIKURA_DISCORD_INVITE = "https://discord.gg/cm72gXTASn";

export const DISCORD_PARTNERS: DiscordPartner[] = [
  {
    id: "anikura",
    name: "Anikura",
    iconUrl: "/discord/anikura.png",
    memberCount: 1280,
    inviteUrl: ANIKURA_DISCORD_INVITE,
    featured: true,
  },
];

export function formatMemberCount(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(n);
}
