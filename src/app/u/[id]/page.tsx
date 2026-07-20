import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import type { AnimeListEntry } from "@/lib/anime-list";
import type { PublicProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSessionUser } from "@/lib/auth";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  if (!isSupabaseConfigured()) return { title: "Profile" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("nickname, email")
    .eq("id", id)
    .maybeSingle();
  const name =
    data?.nickname?.trim() || data?.email?.split("@")[0] || "Profile";
  return { title: name };
}

export default async function PublicProfilePage({ params }: Props) {
  if (!isSupabaseConfigured()) notFound();

  const { id } = await params;
  const supabase = await createClient();
  const [{ data: profile }, { data: list }, me] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, nickname, bio, avatar_url, banner_url, created_at, role",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("anime_list")
      .select("*")
      .eq("user_id", id)
      .order("updated_at", { ascending: false }),
    getSessionUser(),
  ]);

  if (!profile) notFound();

  return (
    <ProfileView
      profile={profile as PublicProfile}
      list={(list ?? []) as AnimeListEntry[]}
      isOwner={me?.id === id}
    />
  );
}
