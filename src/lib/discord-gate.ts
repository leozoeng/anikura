import { ANIKURA_DISCORD_INVITE } from "@/lib/discord-partners";

export function getDiscordInviteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() || ANIKURA_DISCORD_INVITE
  );
}

export function getDiscordGuildId(): string | null {
  const id = process.env.DISCORD_GUILD_ID?.trim();
  return id || null;
}

export function getDiscordBotToken(): string | null {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  return token || null;
}

/** Discord gate is active when guild + bot are configured. */
export function isDiscordGateConfigured(): boolean {
  return Boolean(getDiscordGuildId() && getDiscordBotToken());
}

export function adminEmailsFromEnv(): string[] {
  const raw = process.env.ADMIN_EMAIL ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowlistedAdminEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  return adminEmailsFromEnv().includes(email.trim().toLowerCase());
}

/**
 * Check whether a Discord user is a member of the Anikura guild.
 * Uses the Bot token (server must have the bot invited with members intent).
 */
export async function isDiscordGuildMember(
  discordUserId: string,
): Promise<{ ok: true; member: true } | { ok: true; member: false } | { ok: false; error: string }> {
  const guildId = getDiscordGuildId();
  const token = getDiscordBotToken();
  if (!guildId || !token) {
    return { ok: false, error: "discord_not_configured" };
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

  const body = await res.text().catch(() => "");
  return {
    ok: false,
    error: `discord_api_${res.status}${body ? `:${body.slice(0, 120)}` : ""}`,
  };
}

/** Pull Discord snowflake from a Supabase user identities list. */
export function discordIdFromIdentities(
  identities:
    | Array<{
        provider?: string;
        id?: string;
        identity_data?: Record<string, unknown> | null;
      }>
    | null
    | undefined,
): string | null {
  if (!identities?.length) return null;
  const discord = identities.find((i) => i.provider === "discord");
  if (!discord) return null;

  const data = discord.identity_data ?? {};
  const fromData =
    (typeof data.provider_id === "string" && data.provider_id) ||
    (typeof data.sub === "string" && data.sub) ||
    (typeof data.id === "string" && data.id) ||
    null;

  if (fromData && /^\d+$/.test(fromData)) return fromData;
  if (discord.id && /^\d+$/.test(discord.id)) return discord.id;
  return fromData;
}
