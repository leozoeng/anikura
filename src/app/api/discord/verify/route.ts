import { NextResponse } from "next/server";
import {
  discordIdFromIdentities,
  discordMembershipErrorMessage,
  isDiscordGateConfigured,
  isDiscordGuildMember,
  type DiscordIdentityLike,
} from "@/lib/discord-gate";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveDiscordId(
  userId: string,
  identities: DiscordIdentityLike[] | null | undefined,
): Promise<string | null> {
  const fromUser = discordIdFromIdentities(identities);
  if (fromUser) return fromUser;

  // Fresh linkIdentity sometimes leaves getUser().identities stale — ask again.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUserIdentities();
  if (!error) {
    const fromList = discordIdFromIdentities(
      data?.identities as DiscordIdentityLike[] | undefined,
    );
    if (fromList) return fromList;
  }

  // Admin API has the canonical identity rows.
  const service = createServiceClient();
  if (!service) return null;
  const { data: adminUser, error: adminError } =
    await service.auth.admin.getUserById(userId);
  if (adminError || !adminUser?.user) return null;
  return discordIdFromIdentities(
    adminUser.user.identities as DiscordIdentityLike[] | undefined,
  );
}

/**
 * Confirm the signed-in user linked Discord and is in the Anikura guild.
 * Writes profiles.discord_* + app_metadata.discord_verified for the proxy gate.
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
  }
  if (!isDiscordGateConfigured()) {
    return NextResponse.json(
      { error: "discord_not_configured" },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const discordId = await resolveDiscordId(
    user.id,
    user.identities as DiscordIdentityLike[] | undefined,
  );
  if (!discordId) {
    return NextResponse.json(
      {
        error: "discord_not_linked",
        message:
          "Link your Discord account first (step 1). If you already did, unlink and link again.",
      },
      { status: 400 },
    );
  }

  const membership = await isDiscordGuildMember(discordId);
  if (!membership.ok) {
    return NextResponse.json(
      {
        error: membership.error,
        message: discordMembershipErrorMessage(membership),
      },
      { status: membership.status === 403 ? 503 : 502 },
    );
  }
  if (!membership.member) {
    return NextResponse.json(
      {
        error: "not_in_server",
        message: discordMembershipErrorMessage(membership),
        discordId,
      },
      { status: 403 },
    );
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "service_role_missing" },
      { status: 503 },
    );
  }

  const verifiedAt = new Date().toISOString();

  // Clear this discord_id from any other profile first (re-link / old accounts).
  await service
    .from("profiles")
    .update({ discord_id: null, discord_verified_at: null })
    .eq("discord_id", discordId)
    .neq("id", user.id);

  const { error: profileError } = await service
    .from("profiles")
    .update({
      discord_id: discordId,
      discord_verified_at: verifiedAt,
    })
    .eq("id", user.id);

  if (profileError) {
    const dup = /duplicate|unique/i.test(profileError.message);
    return NextResponse.json(
      {
        error: dup ? "discord_already_linked" : "profile_update_failed",
        message: dup
          ? "This Discord is already tied to another Anikura account. Unlink there or contact admin."
          : profileError.message,
        detail: profileError.message,
      },
      { status: dup ? 409 : 500 },
    );
  }

  const { error: metaError } = await service.auth.admin.updateUserById(
    user.id,
    {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        discord_verified: true,
        discord_id: discordId,
      },
    },
  );

  if (metaError) {
    return NextResponse.json(
      { error: "metadata_update_failed", detail: metaError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    discordId,
    verifiedAt,
  });
}
