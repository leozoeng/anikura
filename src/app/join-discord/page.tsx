import { redirect } from "next/navigation";
import { JoinDiscordClient } from "@/components/auth/join-discord-client";
import { getSessionUser } from "@/lib/auth";
import {
  discordIdFromIdentities,
  getDiscordInviteUrl,
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

  // Admins + special-case bypass emails skip the Discord gate.
  if (gateConfigured && skipsDiscordGate(user.email)) {
    if (user.app_metadata?.discord_verified !== true) {
      await persistBypassVerified(
        user.id,
        user.app_metadata as Record<string, unknown> | undefined,
      );
      const supabase = await createClient();
      await supabase.auth.refreshSession();
    }
    redirect(next);
  }

  if (gateConfigured && user.app_metadata?.discord_verified === true) {
    redirect(next);
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("discord_id, discord_verified_at")
    .eq("id", user.id)
    .maybeSingle();

  // Profile says verified but JWT is stale — heal app_metadata so the proxy lets them through.
  if (
    gateConfigured &&
    profile?.discord_verified_at &&
    user.app_metadata?.discord_verified !== true
  ) {
    const service = createServiceClient();
    if (service) {
      await service.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...(user.app_metadata ?? {}),
          discord_verified: true,
          discord_id: profile.discord_id ?? user.app_metadata?.discord_id,
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
