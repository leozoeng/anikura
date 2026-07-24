import { redirect } from "next/navigation";
import { JoinDiscordClient } from "@/components/auth/join-discord-client";
import { getSessionUser } from "@/lib/auth";
import {
  discordIdFromIdentities,
  getDiscordInviteUrl,
  hasStaleDiscordBypass,
  isDiscordGateConfigured,
  skipsDiscordGate,
} from "@/lib/discord-gate";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Connect Discord",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

async function persistBypassVerified(
  userId: string,
  existingMeta: Record<string, unknown> | undefined,
) {
  const service = createServiceClient();
  if (!service) return;
  const verifiedAt = new Date().toISOString();
  await service
    .from("profiles")
    .update({ discord_verified_at: verifiedAt })
    .eq("id", userId)
    .is("discord_verified_at", null);
  await service.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(existingMeta ?? {}),
      discord_verified: true,
      discord_bypass: true,
    },
  });
}

/** Drop old admin/email exemption flags so the user must Connect Discord. */
async function clearStaleBypass(
  userId: string,
  existingMeta: Record<string, unknown> | undefined,
) {
  const service = createServiceClient();
  if (!service) return;
  const nextMeta = { ...(existingMeta ?? {}) };
  delete nextMeta.discord_verified;
  delete nextMeta.discord_bypass;
  await service.auth.admin.updateUserById(userId, {
    app_metadata: nextMeta,
  });
  await service
    .from("profiles")
    .update({ discord_verified_at: null })
    .eq("id", userId);
}

export default async function JoinDiscordPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/";

  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/join-discord")}`);
  }

  const gateConfigured = isDiscordGateConfigured();
  const appMeta = user.app_metadata as Record<string, unknown> | undefined;

  // Optional DISCORD_BYPASS_EMAILS only.
  if (gateConfigured && skipsDiscordGate(user.email)) {
    if (user.app_metadata?.discord_verified !== true) {
      await persistBypassVerified(user.id, appMeta);
      const supabase = await createClient();
      await supabase.auth.refreshSession();
    }
    redirect(next);
  }

  // Admin (or others) previously auto-exempted — wipe and show Connect Discord.
  if (gateConfigured && hasStaleDiscordBypass(user.email, appMeta)) {
    await clearStaleBypass(user.id, appMeta);
    const supabase = await createClient();
    await supabase.auth.refreshSession();
  } else if (gateConfigured && user.app_metadata?.discord_verified === true) {
    redirect(next);
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("discord_id, discord_verified_at")
    .eq("id", user.id)
    .maybeSingle();

  // Profile says verified but JWT is stale — heal app_metadata so the proxy lets them through.
  // Skip heal when this was a wiped bypass (no verified_at after clear).
  if (
    gateConfigured &&
    profile?.discord_verified_at &&
    user.app_metadata?.discord_verified !== true &&
    !hasStaleDiscordBypass(user.email, appMeta)
  ) {
    const service = createServiceClient();
    if (service) {
      const healedMeta = { ...(appMeta ?? {}) };
      delete healedMeta.discord_bypass;
      await service.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...healedMeta,
          discord_verified: true,
          discord_id: profile.discord_id ?? appMeta?.discord_id,
        },
      });
      await supabase.auth.refreshSession();
    }
    redirect(next);
  }

  const discordLinked = Boolean(
    discordIdFromIdentities(user.identities) || profile?.discord_id,
  );

  return (
    <JoinDiscordClient
      nextPath={next}
      inviteUrl={getDiscordInviteUrl()}
      discordLinked={discordLinked}
      gateConfigured={gateConfigured}
    />
  );
}
