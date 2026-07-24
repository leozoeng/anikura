import { ANIKURA_DISCORD_INVITE } from "@/lib/discord-partners";

/**
 * Optional one-off Discord gate exemptions via env only (`DISCORD_BYPASS_EMAILS`).
 * Admins are NOT exempt — they go through Connect Discord like everyone else.
 */
export function getDiscordInviteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() || ANIKURA_DISCORD_INVITE
  );
}

export function getDiscordGuildId(): string | null {
  const id = process.env.DISCORD_GUILD_ID?.trim();
  // Discord snowflakes are numeric; reject accidental channel/app IDs pasted wrong
  // only if clearly non-numeric.
  if (!id) return null;
  if (!/^\d{5,}$/.test(id)) return null;
  return id;
}

export function getDiscordBotToken(): string | null {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  return token || null;
}

/** Discord gate is active when guild + bot are configured. */
export function isDiscordGateConfigured(): boolean {
  return Boolean(getDiscordGuildId() && getDiscordBotToken());
}

/** Skip Discord onboarding for emails in DISCORD_BYPASS_EMAILS only. */
export function isDiscordBypassEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const fromEnv = process.env.DISCORD_BYPASS_EMAILS ?? "";
  return fromEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}

/**
 * True when verification was granted by an old email/admin exemption
 * (`discord_bypass`) that no longer applies — force Connect Discord again.
 */
export function hasStaleDiscordBypass(
  email: string | null | undefined,
  appMetadata: Record<string, unknown> | null | undefined,
): boolean {
  if (appMetadata?.discord_bypass !== true) return false;
  return !isDiscordBypassEmail(email);
}

/** Explicit Discord bypass emails only (admins must verify). */
export function skipsDiscordGate(email: string | null | undefined): boolean {
  return isDiscordBypassEmail(email);
}

/**
 * Check whether a Discord user is a member of the Anikura guild.
 * Uses the Bot token (server must have the bot invited with Server Members Intent).
 */
export async function isDiscordGuildMember(
  discordUserId: string,
): Promise<
  | { ok: true; member: true }
  | { ok: true; member: false }
  | { ok: false; error: string; status?: number }
> {
  const guildId = getDiscordGuildId();
  const token = getDiscordBotToken();
  if (!guildId || !token) {
    return { ok: false, error: "discord_not_configured" };
  }
  if (!/^\d{5,}$/.test(discordUserId)) {
    return { ok: false, error: "invalid_discord_id" };
  }

  const url = `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (res.status === 200) return { ok: true, member: true };
  if (res.status === 404) return { ok: true, member: false };

  // 403 usually means Server Members Intent is off, or bot lacks access.
  if (res.status === 403) {
    return {
      ok: false,
      error: "discord_members_intent",
      status: 403,
    };
  }

  const body = await res.text().catch(() => "");
  return {
    ok: false,
    error: `discord_api_${res.status}${body ? `:${body.slice(0, 120)}` : ""}`,
    status: res.status,
  };
}

function snowflakeFromUnknown(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const s = String(Math.trunc(value));
    return /^\d{5,}$/.test(s) ? s : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  // Bare snowflake
  if (/^\d{5,}$/.test(trimmed)) return trimmed;
  // Rare: "discord:123…" or URL tail
  const tail = trimmed.match(/(\d{5,})\s*$/);
  return tail?.[1] ?? null;
}

export type DiscordIdentityLike = {
  provider?: string;
  id?: string;
  user_id?: string;
  identity_data?: Record<string, unknown> | null;
};

/**
 * Pull Discord snowflake from a Supabase user identities list.
 * Never returns auth.identities.id (UUID) — that caused false "not in server".
 */
export function discordIdFromIdentities(
  identities: DiscordIdentityLike[] | null | undefined,
): string | null {
  if (!identities?.length) return null;
  const discord = identities.find((i) => i.provider === "discord");
  if (!discord) return null;

  const data = discord.identity_data ?? {};
  const candidates: unknown[] = [
    data.provider_id,
    data.sub,
    data.id,
    data.user_id,
    // Last resort only if the identity row id itself is numeric (unusual)
    discord.id,
  ];

  for (const candidate of candidates) {
    const snowflake = snowflakeFromUnknown(candidate);
    if (snowflake) return snowflake;
  }

  return null;
}

/** Human message for membership / Discord API failures. */
export function discordMembershipErrorMessage(
  result: Awaited<ReturnType<typeof isDiscordGuildMember>>,
): string {
  if (result.ok) {
    return result.member
      ? "You're in the server."
      : "That Discord account isn't in the Anikura server yet. Open the invite, join, then verify again.";
  }
  if (result.error === "discord_members_intent") {
    return "Discord bot can't read members (enable Server Members Intent and re-invite the bot).";
  }
  if (result.error === "invalid_discord_id") {
    return "Could not read your Discord user id after linking. Unlink and link Discord again.";
  }
  if (result.error === "discord_not_configured") {
    return "Discord gate isn't configured on the server.";
  }
  return "Couldn't reach Discord to verify membership. Try again in a moment.";
}
