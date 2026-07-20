import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { getSessionUser } from "@/lib/auth";
import type { AnimeListEntry } from "@/lib/anime-list";
import {
  DEFAULT_ACCENT_HEX,
  PROFILE_SELECT,
  type PublicProfile,
} from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) {
    redirect("/login?next=/profile");
  }

  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/profile");
  }

  const supabase = await createClient();
  const [{ data: profile }, { data: list }] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("anime_list")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  const resolved: PublicProfile = profile ?? {
    id: user.id,
    email: user.email ?? null,
    nickname: user.email?.split("@")[0] ?? "Viewer",
    bio: null,
    avatar_url: null,
    banner_url: null,
    created_at: user.created_at,
    accent_hex: DEFAULT_ACCENT_HEX,
    accent_ambient: true,
  };

  return (
    <ProfileView
      profile={resolved}
      list={(list ?? []) as AnimeListEntry[]}
      isOwner
    />
  );
}
