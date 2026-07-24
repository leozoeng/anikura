import { redirect } from "next/navigation";
import { JoinDiscordClient } from "@/components/auth/join-discord-client";
import { getSessionUser } from "@/lib/auth";
import {
  discordIdFromIdentities,
  getDiscordInviteUrl,
  isAllowlistedAdminEmail,
  isDiscordGateConfigured,
} from "@/lib/discord-gate";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Join Discord",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

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

  if (!isDiscordGateConfigured()) {
    redirect(next);
  }

  if (
    isAllowlistedAdminEmail(user.email) ||
    user.app_metadata?.discord_verified === true
  ) {
    redirect(next);
  }

  // Profile flag as fallback if JWT metadata is stale mid-session.
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("discord_verified_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.discord_verified_at) {
    redirect(next);
  }

  const discordLinked = Boolean(discordIdFromIdentities(user.identities));

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 pb-16 pt-24">
      <JoinDiscordClient
        nextPath={next}
        inviteUrl={getDiscordInviteUrl()}
        discordLinked={discordLinked}
        gateConfigured={isDiscordGateConfigured()}
      />
    </div>
  );
}
