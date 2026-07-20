/**
 * Add a Discord user to the Anikura guild via OAuth2 guilds.join.
 * Requires: user token with guilds.join, bot in guild with Create Instant Invite.
 * @see https://discord.com/developers/docs/resources/guild#add-guild-member
 */
export async function joinDiscordGuild(
  discordUserId: string,
  userAccessToken: string,
): Promise<{ ok: boolean; status?: number; detail?: string }> {
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  const botToken = process.env.DISCORD_BOT_TOKEN?.trim();

  if (!guildId || !botToken) {
    console.warn(
      "[discord] Skipping guild join — set DISCORD_GUILD_ID and DISCORD_BOT_TOKEN",
    );
    return { ok: false, detail: "missing_env" };
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: userAccessToken }),
      },
    );

    // 201 = joined, 204 = already a member
    if (res.status === 201 || res.status === 204) {
      return { ok: true, status: res.status };
    }

    const body = await res.text().catch(() => "");
    console.warn(
      `[discord] Guild join failed (${res.status}): ${body.slice(0, 300)}`,
    );
    return { ok: false, status: res.status, detail: body.slice(0, 300) };
  } catch (err) {
    console.warn("[discord] Guild join error:", err);
    return { ok: false, detail: "network_error" };
  }
}
