import { SiteHeader } from "@/components/site-header";
import { getProfile, isAdminUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function SiteHeaderServer() {
  if (!isSupabaseConfigured()) {
    return <SiteHeader />;
  }

  try {
    const [profile, admin] = await Promise.all([getProfile(), isAdminUser()]);
    return (
      <SiteHeader
        email={profile?.email ?? null}
        isAdmin={admin}
        avatarUrl={profile?.avatar_url ?? null}
        nickname={profile?.nickname ?? null}
      />
    );
  } catch {
    return <SiteHeader />;
  }
}
