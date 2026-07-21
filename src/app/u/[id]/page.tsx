import { notFound, redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import type { AnimeListEntry } from "@/lib/anime-list";
import { getSessionUser } from "@/lib/auth";
import {
  PROFILE_SELECT,
  isProfileUuid,
  normalizeUsername,
  type PublicProfile,
} from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = {
  params: Promise<{ id: string }>;
};

async function loadProfile(param: string) {
  const supabase = await createClient();
  const key = param.trim();

  if (isProfileUuid(key)) {
    const { data } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", key)
      .maybeSingle();
    return data as PublicProfile | null;
  }

  const handle = normalizeUsername(key);
  if (!handle) return null;

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("username", handle)
    .maybeSingle();
  return data as PublicProfile | null;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  if (!isSupabaseConfigured()) return { title: "Profile" };
  const profile = await loadProfile(id);
  const name =
    profile?.nickname?.trim() ||
    profile?.username?.trim() ||
    profile?.email?.split("@")[0] ||
    "Profile";
  return { title: name };
}

export default async function PublicProfilePage({ params }: Props) {
  if (!isSupabaseConfigured()) notFound();

  const { id } = await params;
  const profile = await loadProfile(id);
  if (!profile) notFound();

  // Canonical vanity URL when opened via UUID.
  const vanity = normalizeUsername(profile.username);
  if (isProfileUuid(id.trim()) && vanity) {
    redirect(`/u/${vanity}`);
  }

  const supabase = await createClient();
  const [{ data: list }, me] = await Promise.all([
    supabase
      .from("anime_list")
      .select("*")
      .eq("user_id", profile.id)
      .order("updated_at", { ascending: false }),
    getSessionUser(),
  ]);

  const isOwner = me?.id === profile.id;

  return (
    <ProfileView
      profile={profile}
      list={(list ?? []) as AnimeListEntry[]}
      isOwner={isOwner}
      showQuitProfile={Boolean(me) && !isOwner}
    />
  );
}
