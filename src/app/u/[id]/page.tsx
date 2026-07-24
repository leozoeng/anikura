import { notFound, redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import type { AnimeListEntry } from "@/lib/anime-list";
import { getSessionUser } from "@/lib/auth";
import { fetchUserProfileComments } from "@/lib/comments-server";
import {
  PUBLIC_PROFILE_SELECT,
  isProfileUuid,
  vanityUsernameFromParam,
  type PublicProfile,
} from "@/lib/profile";
import {
  WATCH_ACTIVITY_SELECT,
  watchActivityToProgress,
  type WatchActivityRow,
} from "@/lib/watch-activity";
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
      .select(PUBLIC_PROFILE_SELECT)
      .eq("id", key)
      .maybeSingle();
    return data as PublicProfile | null;
  }

  const handle = vanityUsernameFromParam(key);
  if (!handle) return null;

  const { data } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_SELECT)
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
    "Profile";
  return { title: name };
}

export default async function PublicProfilePage({ params }: Props) {
  if (!isSupabaseConfigured()) notFound();

  const { id } = await params;
  const profile = await loadProfile(id);
  if (!profile) notFound();

  // Canonical solo.to-style URL when opened via UUID.
  // Only redirect UUID → /@handle (not /u/handle → /@handle) to avoid
  // loops with the proxy rewrite of /@handle → /u/handle.
  const vanity = vanityUsernameFromParam(profile.username);
  if (isProfileUuid(id.trim()) && vanity) {
    redirect(`/@${vanity}`);
  }

  const supabase = await createClient();
  const me = await getSessionUser();
  const isOwner = me?.id === profile.id;
  const canViewActivity = isOwner || Boolean(profile.activity_public);

  const [{ data: list }, { data: activityRows }, comments] = await Promise.all([
    supabase
      .from("anime_list")
      .select("*")
      .eq("user_id", profile.id)
      .order("updated_at", { ascending: false }),
    canViewActivity
      ? supabase
          .from("watch_activity")
          .select(WATCH_ACTIVITY_SELECT)
          .eq("user_id", profile.id)
          .order("updated_at", { ascending: false })
          .limit(24)
      : Promise.resolve({ data: [] as WatchActivityRow[] }),
    fetchUserProfileComments(profile.id),
  ]);

  // Never ship operator/user email to other visitors' browsers.
  const publicProfile: PublicProfile = isOwner
    ? profile
    : { ...profile, email: null };

  const activity = canViewActivity
    ? ((activityRows ?? []) as WatchActivityRow[]).map(watchActivityToProgress)
    : [];

  return (
    <ProfileView
      profile={publicProfile}
      list={(list ?? []) as AnimeListEntry[]}
      activity={activity}
      comments={comments}
      isOwner={isOwner}
      showQuitProfile={Boolean(me) && !isOwner}
    />
  );
}
