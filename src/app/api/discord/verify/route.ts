import { NextResponse } from "next/server";
import {
  discordIdFromIdentities,
  isDiscordGateConfigured,
  isDiscordGuildMember,
} from "@/lib/discord-gate";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const discordId = discordIdFromIdentities(user.identities);
  if (!discordId) {
    return NextResponse.json(
      {
        error: "discord_not_linked",
        message: "Link your Discord account first.",
      },
      { status: 400 },
    );
  }

  const membership = await isDiscordGuildMember(discordId);
  if (!membership.ok) {
    return NextResponse.json(
      { error: membership.error },
      { status: 502 },
    );
  }
  if (!membership.member) {
    return NextResponse.json(
      {
        error: "not_in_server",
        message: "Join the Anikura Discord server, then try again.",
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

  const { error: profileError } = await service
    .from("profiles")
    .update({
      discord_id: discordId,
      discord_verified_at: verifiedAt,
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json(
      { error: "profile_update_failed", detail: profileError.message },
      { status: 500 },
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
