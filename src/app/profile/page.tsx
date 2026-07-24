import { ProfileView } from "@/components/profile/profile-view";
import { GuestSocialPreview } from "@/components/social/guest-social-preview";
import { getSessionUser } from "@/lib/auth";
import type { AnimeListEntry } from "@/lib/anime-list";
import { fetchUserProfileComments } from "@/lib/comments-server";
import {
  DEFAULT_ACCENT_HEX,
  PROFILE_SELECT,
  type PublicProfile,
} from "@/lib/profile";
import {
  WATCH_ACTIVITY_SELECT,
  watchActivityToProgress,
  type WatchActivityRow,
} from "@/lib/watch-activity";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Social",
};

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) {
    return <GuestSocialPreview />;
  }

  const user = await getSessionUser();
  if (!user) {
    return <GuestSocialPreview />;
  }

  const supabase = await createClient();
  const [{ data: profile }, { data: list }, { data: activityRows }, comments] =
    await Promise.all([
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
      supabase
        .from("watch_activity")
        .select(WATCH_ACTIVITY_SELECT)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(24),
      fetchUserProfileComments(user.id),
    ]);

  const resolved: PublicProfile = profile ?? {
    id: user.id,
    email: user.email ?? null,
    nickname: "Viewer",
    bio: null,
    avatar_url: null,
    banner_url: null,
    created_at: user.created_at,
    accent_hex: DEFAULT_ACCENT_HEX,
    accent_ambient: true,
    activity_public: false,
  };

  const activity = ((activityRows ?? []) as WatchActivityRow[]).map(
    watchActivityToProgress,
  );

  return (
    <ProfileView
      profile={resolved}
      list={(list ?? []) as AnimeListEntry[]}
      activity={activity}
      comments={comments}
      isOwner
      showSocialRail
    />
  );
}
