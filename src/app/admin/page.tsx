import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminRefresh } from "@/components/admin/admin-refresh";
import {
  enrichHotPages,
  enrichHotWatched,
  labelAdminPath,
  type HotPageRow,
  type HotWatchRow,
} from "@/lib/admin-hot-paths";
import { ensureAdminRole, getProfile, isAdminUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-20 pt-28 text-center">
        <h1 className="text-2xl text-snow">Admin unavailable</h1>
        <p className="mt-2 text-sm text-cloud">
          Set <code className="text-sakura-soft">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and{" "}
          <code className="text-sakura-soft">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          in <code className="text-cloud">.env.local</code>.
        </p>
      </div>
    );
  }

  const profile = await getProfile();
  if (!profile) {
    redirect("/login?next=/admin");
  }

  const admin = await isAdminUser();
  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-20 pt-28 text-center">
        <h1 className="text-2xl text-snow">Access denied</h1>
        <p className="mt-2 text-sm text-cloud">
          This desk is for admins only. Set{" "}
          <code className="text-sakura-soft">ADMIN_EMAIL</code> or promote your
          profile role to <code className="text-cloud">admin</code>.
        </p>
      </div>
    );
  }

  await ensureAdminRole();

  const supabase = await createClient();

  const [
    { data: metricsRaw },
    { data: presence },
    { data: series },
    { data: activityRaw },
    { data: hotRaw },
    catalog,
  ] = await Promise.all([
    supabase.rpc("admin_dashboard_metrics", { p_live_seconds: 120 }),
    supabase.rpc("admin_live_presence", { p_live_seconds: 120 }),
    supabase.rpc("admin_signup_series", { p_days: 90 }),
    supabase.rpc("admin_activity_series", { p_days: 90 }),
    supabase.rpc("admin_hot_activity", { p_limit: 8 }),
    getCatalog(),
  ]);

  const metrics = (metricsRaw ?? {}) as {
    live_users?: number;
    total_signups?: number;
    signups_today?: number;
    signups_7d?: number;
    page_views_today?: number;
    page_views_7d?: number;
    sessions_today?: number;
    sessions_7d?: number;
    sessions_30d?: number;
    unique_visitors_today?: number;
    returning_visitors_today?: number;
    watch_seconds_today?: number | string;
  };

  const hot = (hotRaw ?? {}) as {
    top_pages?: HotPageRow[];
    top_watched?: HotWatchRow[];
  };

  const presenceRows = (presence ?? []) as Array<{
    id: string;
    session_id: string | null;
    user_id: string | null;
    email: string | null;
    nickname: string | null;
    username: string | null;
    lat: number | null;
    lng: number | null;
    country: string | null;
    city: string | null;
    device?: string | null;
    user_agent?: string | null;
    first_seen?: string | null;
    last_seen: string;
    path: string | null;
  }>;

  const activity = (
    (activityRaw ?? []) as Array<{
      day: string;
      page_views: number;
      sessions?: number;
      watch_seconds: number | string;
    }>
  ).map((row) => ({
    day: String(row.day).slice(0, 10),
    page_views: Number(row.page_views ?? 0),
    sessions: Number(row.sessions ?? 0),
    watch_seconds: Number(row.watch_seconds ?? 0),
  }));

  const byId = new Map(catalog.map((a) => [a.id, a]));

  return (
    <>
      <AdminRefresh intervalMs={45_000} />
      <AdminDashboard
        adminEmail={profile.email}
        activity={activity}
        topPages={enrichHotPages(hot.top_pages ?? [], catalog)}
        topWatched={enrichHotWatched(hot.top_watched ?? [], catalog)}
        metrics={{
          live_users: metrics.live_users ?? 0,
          total_signups: metrics.total_signups ?? 0,
          signups_today: metrics.signups_today ?? 0,
          signups_7d: metrics.signups_7d ?? 0,
          page_views_today: metrics.page_views_today ?? 0,
          page_views_7d: metrics.page_views_7d ?? 0,
          sessions_today:
            metrics.sessions_today ?? metrics.unique_visitors_today ?? 0,
          sessions_7d: metrics.sessions_7d ?? 0,
          sessions_30d: metrics.sessions_30d ?? 0,
          unique_visitors_today: metrics.unique_visitors_today ?? 0,
          returning_visitors_today: metrics.returning_visitors_today ?? 0,
          watch_seconds_today: Number(metrics.watch_seconds_today ?? 0),
        }}
        presence={presenceRows
          .filter((p) => Boolean(p.id))
          .map((p) => {
            const labeled = labelAdminPath(p.path || "/", byId);
            return {
              id: p.id,
              session_id: p.session_id,
              user_id: p.user_id,
              email: p.email,
              nickname: p.nickname,
              username: p.username ?? null,
              lat: p.lat,
              lng: p.lng,
              country: p.country,
              city: p.city,
              device: p.device ?? null,
              user_agent: p.user_agent ?? null,
              first_seen: p.first_seen ?? null,
              last_seen: p.last_seen,
              path: p.path,
              path_label: labeled.label,
              path_meta: labeled.meta,
            };
          })}
        series={((series ?? []) as Array<{ day: string; signups: number }>).map(
          (row) => ({
            day: String(row.day).slice(0, 10),
            signups: row.signups,
          }),
        )}
      />
    </>
  );
}
