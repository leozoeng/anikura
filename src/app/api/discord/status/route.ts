import { NextResponse } from "next/server";
import {
  discordIdFromIdentities,
  isAllowlistedAdminEmail,
  isDiscordGateConfigured,
  isDiscordGuildMember,
  type DiscordIdentityLike,
} from "@/lib/discord-gate";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StatusBody = {
  gateRequired: boolean;
  verified: boolean;
  linked: boolean;
  /** True when we repaired JWT metadata from an existing DB verification. */
  healed?: boolean;
};

async function markVerified(
  userId: string,
  discordId: string,
  existingAppMeta: Record<string, unknown> | undefined,
) {
  const service = createServiceClient();
  if (!service) return false;

  const verifiedAt = new Date().toISOString();

  await service
    .from("profiles")
    .update({ discord_id: null, discord_verified_at: null })
    .eq("discord_id", discordId)
    .neq("id", userId);

  const { error: profileError } = await service
    .from("profiles")
    .update({
      discord_id: discordId,
      discord_verified_at: verifiedAt,
    })
    .eq("id", userId);

  if (profileError) return false;

  const { error: metaError } = await service.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(existingAppMeta ?? {}),
      discord_verified: true,
      discord_id: discordId,
    },
  });

  return !metaError;
}

async function resolveDiscordId(
  userId: string,
  identities: DiscordIdentityLike[] | null | undefined,
): Promise<string | null> {
  const fromUser = discordIdFromIdentities(identities);
  if (fromUser) return fromUser;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUserIdentities();
  const fromList = discordIdFromIdentities(
    data?.identities as DiscordIdentityLike[] | undefined,
  );
  if (fromList) return fromList;

  const service = createServiceClient();
  if (!service) return null;
  const { data: adminUser } = await service.auth.admin.getUserById(userId);
  return discordIdFromIdentities(
    adminUser?.user?.identities as DiscordIdentityLike[] | undefined,
  );
}

/**
 * Client refresh helper: should this signed-in user finish Discord onboarding?
 * Already-verified (or linked + in-server) members are healed and left alone.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      gateRequired: false,
      verified: true,
      linked: false,
    } satisfies StatusBody);
  }

  const gateRequired = isDiscordGateConfigured();
  if (!gateRequired) {
    return NextResponse.json({
      gateRequired: false,
      verified: true,
      linked: false,
    } satisfies StatusBody);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (isAllowlistedAdminEmail(user.email)) {
    return NextResponse.json({
      gateRequired: true,
      verified: true,
      linked: true,
    } satisfies StatusBody);
  }

  const discordId = await resolveDiscordId(
    user.id,
    user.identities as DiscordIdentityLike[] | undefined,
  );
  const linked = Boolean(discordId);

  if (user.app_metadata?.discord_verified === true) {
    return NextResponse.json({
      gateRequired: true,
      verified: true,
      linked,
    } satisfies StatusBody);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("discord_id, discord_verified_at")
    .eq("id", user.id)
    .maybeSingle();

  const profileDiscordId =
    (typeof profile?.discord_id === "string" &&
    /^\d{5,}$/.test(profile.discord_id)
      ? profile.discord_id
      : null) || discordId;

  // Already finished onboarding earlier — repair JWT so proxy stops redirecting.
  if (profile?.discord_verified_at && profileDiscordId) {
    const healed = await markVerified(
      user.id,
      profileDiscordId,
      user.app_metadata as Record<string, unknown> | undefined,
    );
    return NextResponse.json({
      gateRequired: true,
      verified: true,
      linked: true,
      healed,
    } satisfies StatusBody);
  }

  // Linked Discord but never clicked Verify — if they're in the guild, finish quietly.
  if (discordId) {
    const membership = await isDiscordGuildMember(discordId);
    if (membership.ok && membership.member) {
      const healed = await markVerified(
        user.id,
        discordId,
        user.app_metadata as Record<string, unknown> | undefined,
      );
      if (healed) {
        return NextResponse.json({
          gateRequired: true,
          verified: true,
          linked: true,
          healed: true,
        } satisfies StatusBody);
      }
    }

    return NextResponse.json({
      gateRequired: true,
      verified: false,
      linked: true,
    } satisfies StatusBody);
  }

  // Account exists, Discord never linked — client should send them to /join-discord.
  return NextResponse.json({
    gateRequired: true,
    verified: false,
    linked: false,
  } satisfies StatusBody);
}
