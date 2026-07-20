import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminRefresh } from "@/components/admin/admin-refresh";
import { ensureAdminRole, getProfile, isAdminUser } from "@/lib/auth";
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

  const [{ data: metricsRaw }, { data: presence }, { data: series }] =
    await Promise.all([
      supabase.rpc("admin_dashboard_metrics", { p_live_seconds: 120 }),
      supabase.rpc("admin_live_presence", { p_live_seconds: 120 }),
      supabase.rpc("admin_signup_series", { p_days: 30 }),
    ]);

  const metrics = (metricsRaw ?? {}) as {
    live_users?: number;
    total_signups?: number;
    signups_today?: number;
    signups_7d?: number;
    page_views_today?: number;
    page_views_7d?: number;
    sessions_live?: number;
  };

  const presenceRows = (presence ?? []) as Array<{
    lat: number | null;
    lng: number | null;
    country: string | null;
    city: string | null;
    last_seen: string;
    path: string | null;
  }>;

  return (
    <>
      <AdminRefresh intervalMs={30_000} />
      <AdminDashboard
        adminEmail={profile.email}
        metrics={{
          live_users: metrics.live_users ?? 0,
          total_signups: metrics.total_signups ?? 0,
          signups_today: metrics.signups_today ?? 0,
          signups_7d: metrics.signups_7d ?? 0,
          page_views_today: metrics.page_views_today ?? 0,
          page_views_7d: metrics.page_views_7d ?? 0,
          sessions_live: metrics.sessions_live ?? 0,
        }}
        presence={presenceRows
          .filter(
            (p): p is typeof p & { lat: number; lng: number } =>
              p.lat != null && p.lng != null,
          )
          .map((p) => ({
            lat: p.lat,
            lng: p.lng,
            country: p.country,
            city: p.city,
            last_seen: p.last_seen,
            path: p.path,
          }))}
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
