"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  AdminCommandStrip,
  type AdminNavItem,
} from "@/components/admin/admin-command-strip";
import {
  AdminEquityCurve,
  type EquitySeries,
} from "@/components/admin/admin-equity-curve";
import { AdminFeedbackProvider } from "@/components/admin/admin-feedback";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { useAdminManualRefresh } from "@/components/admin/admin-refresh";
import { AnnouncementManager } from "@/components/admin/announcement-manager";
import { BadgeManager } from "@/components/admin/badge-manager";
import { HotList } from "@/components/admin/hot-list";
import {
  LiveGlobe,
  type GlobePerson,
} from "@/components/admin/live-globe";
import { VisitorDrawer } from "@/components/admin/visitor-drawer";
import type { HotListItem } from "@/lib/admin-hot-paths";
import type { SocialAnnouncement } from "@/lib/announcements";

export type DashboardMetrics = {
  live_users: number;
  total_signups: number;
  signups_today: number;
  signups_7d: number;
  page_views_today: number;
  page_views_7d: number;
  unique_visitors_today: number;
  returning_visitors_today: number;
  watch_seconds_today: number;
};

export type PresencePoint = GlobePerson;

export type SignupDay = {
  day: string;
  signups: number;
};

export type ActivityDay = {
  day: string;
  page_views: number;
  watch_seconds: number;
};

type AdminDashboardProps = {
  metrics: DashboardMetrics;
  presence: PresencePoint[];
  series: SignupDay[];
  activity: ActivityDay[];
  adminEmail: string | null;
  announcements: SocialAnnouncement[];
  topPages: HotListItem[];
  topWatched: HotListItem[];
};

type RangeKey = "today" | "7d" | "30d";

const NAV: AdminNavItem[] = [
  { id: "admin-live", label: "Live", shortcut: "1" },
  { id: "admin-growth", label: "Growth", shortcut: "2" },
  { id: "admin-users", label: "Users", shortcut: "3" },
  { id: "admin-hot", label: "Hot", shortcut: "4" },
  { id: "admin-globe", label: "Globe", shortcut: "5" },
  { id: "admin-members", label: "Members", shortcut: "6" },
  { id: "admin-announcements", label: "Announcements", shortcut: "7" },
];

function formatHours(seconds: number) {
  const h = seconds / 3600;
  if (h < 0.1) return `${Math.round(seconds / 60)}m`;
  return `${h.toFixed(h >= 10 ? 0 : 1)}h`;
}

function formatSigned(n: number) {
  if (n > 0) return `+${n}`;
  return String(n);
}

function lastN<T>(arr: T[], n: number) {
  return arr.slice(-n);
}

function sumField<T>(arr: T[], pick: (row: T) => number) {
  return arr.reduce((s, row) => s + pick(row), 0);
}

function visitorLabel(p: PresencePoint) {
  return (
    p.nickname?.trim() ||
    p.email?.split("@")[0] ||
    (p.user_id ? "Signed in" : "Guest")
  );
}

function AdminDashboardInner({
  metrics,
  presence,
  series,
  activity,
  adminEmail,
  announcements,
  topPages,
  topWatched,
}: AdminDashboardProps) {
  const [range, setRange] = useState<RangeKey>("today");
  const [curveRange, setCurveRange] = useState<"7" | "14" | "30">("14");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { refresh, refreshing } = useAdminManualRefresh();

  const selected = useMemo(
    () => presence.find((p) => p.id === selectedId) ?? null,
    [presence, selectedId],
  );

  const globePeople = useMemo(
    () =>
      presence.filter(
        (p): p is PresencePoint & { lat: number; lng: number } =>
          p.lat != null && p.lng != null,
      ),
    [presence],
  );

  const openVisitor = useCallback((person: GlobePerson | null) => {
    setSelectedId(person?.id ?? null);
    setDrawerOpen(Boolean(person));
  }, []);

  const onSelect = useCallback(
    (person: GlobePerson | null) => {
      openVisitor(person);
    },
    [openVisitor],
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const topCountries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of presence) {
      const key = p.country || "Unknown";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [presence]);

  const liveNowPaths = useMemo(() => {
    const byPath = new Map<string, PresencePoint[]>();
    for (const p of presence) {
      const key = p.path?.trim() || "/";
      const list = byPath.get(key) ?? [];
      list.push(p);
      byPath.set(key, list);
    }
    return [...byPath.entries()]
      .map(([path, people]) => ({ path, people, n: people.length }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 6);
  }, [presence]);

  const curveSlice = useMemo(() => {
    const n = Number(curveRange);
    return {
      signups: lastN(series, n),
      activity: lastN(activity, n),
    };
  }, [activity, curveRange, series]);

  const equitySeries = useMemo((): EquitySeries[] => {
    const watchHours = curveSlice.activity.map((d) => ({
      day: d.day,
      value: Math.round((d.watch_seconds / 3600) * 10) / 10,
    }));
    return [
      {
        id: "signups",
        label: "Signups",
        color: "rgba(245,245,247,0.92)",
        fill: "rgba(245,245,247,0.28)",
        points: curveSlice.signups.map((d) => ({
          day: d.day,
          value: d.signups,
        })),
      },
      {
        id: "views",
        label: "Page views",
        color: "rgba(200,210,230,0.9)",
        fill: "rgba(200,210,230,0.25)",
        points: curveSlice.activity.map((d) => ({
          day: d.day,
          value: d.page_views,
        })),
      },
      {
        id: "watch",
        label: "Watch hours",
        color: "rgba(180,190,210,0.88)",
        fill: "rgba(180,190,210,0.22)",
        points: watchHours,
        format: (n) => `${n.toFixed(n >= 10 ? 0 : 1)}h`,
      },
    ];
  }, [curveSlice]);

  const signupSpark = useMemo(
    () => lastN(series, 7).map((d) => d.signups),
    [series],
  );
  const viewsSpark = useMemo(
    () => lastN(activity, 7).map((d) => d.page_views),
    [activity],
  );
  const watchSpark = useMemo(
    () => lastN(activity, 7).map((d) => d.watch_seconds),
    [activity],
  );

  const ranged = useMemo(() => {
    const act7 = lastN(activity, 7);
    const act30 = lastN(activity, 30);
    const sig7 = lastN(series, 7);
    const sig30 = lastN(series, 30);

    if (range === "today") {
      return {
        signups: metrics.signups_today,
        signupsHint: (() => {
          const yDate = new Date();
          yDate.setUTCDate(yDate.getUTCDate() - 1);
          const yKey = yDate.toISOString().slice(0, 10);
          const yCount = series.find((d) => d.day === yKey)?.signups;
          if (yCount == null) return `${metrics.signups_7d} in last 7 days`;
          if (yCount === metrics.signups_today) {
            return `Same as yesterday · ${metrics.signups_7d} in 7d`;
          }
          return `${formatSigned(metrics.signups_today - yCount)} vs yesterday · ${metrics.signups_7d} in 7d`;
        })(),
        pageViews: metrics.page_views_today,
        pageViewsHint:
          metrics.page_views_7d > 0
            ? `${metrics.page_views_7d} in 7d · ~${Math.round(metrics.page_views_7d / 7)}/day`
            : "Since midnight UTC",
        watchSeconds: metrics.watch_seconds_today,
        watchHint: "Visible time on /watch today",
        rangeLabel: "Today",
      };
    }

    if (range === "7d") {
      const watch = sumField(act7, (d) => d.watch_seconds) || metrics.watch_seconds_today;
      const views =
        sumField(act7, (d) => d.page_views) || metrics.page_views_7d;
      const signups = sumField(sig7, (d) => d.signups) || metrics.signups_7d;
      return {
        signups,
        signupsHint: `~${(signups / 7).toFixed(1)}/day · ${metrics.total_signups} total`,
        pageViews: views,
        pageViewsHint: `~${Math.round(views / 7)}/day average`,
        watchSeconds: watch,
        watchHint: "Sum of visible /watch time · 7 days",
        rangeLabel: "Last 7 days",
      };
    }

    const watch = sumField(act30, (d) => d.watch_seconds);
    const views = sumField(act30, (d) => d.page_views);
    const signups = sumField(sig30, (d) => d.signups);
    return {
      signups,
      signupsHint: `~${(signups / 30).toFixed(1)}/day · ${metrics.total_signups} total`,
      pageViews: views,
      pageViewsHint:
        views > 0 ? `~${Math.round(views / 30)}/day average` : "No views in range",
      watchSeconds: watch,
      watchHint: "Sum of visible /watch time · 30 days",
      rangeLabel: "Last 30 days",
    };
  }, [activity, metrics, range, series]);

  const newVisitors = Math.max(
    0,
    metrics.unique_visitors_today - metrics.returning_visitors_today,
  );

  const avg7 =
    metrics.signups_7d / 7 >= 0.1
      ? `${metrics.signups_7d} this week · ~${(metrics.signups_7d / 7).toFixed(1)}/day`
      : `${metrics.signups_7d} in the last 7 days`;

  return (
    <div className="page-shell pb-16 pt-20 sm:pt-22">
      <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-mute">
            Anikura · Admin
          </p>
          <h1 className="mt-0.5 text-2xl tracking-[-0.04em] text-snow sm:text-3xl">
            Night desk
          </h1>
          <p className="mt-1 max-w-xl text-xs text-cloud sm:text-sm">
            Live ops — presence, audience, and growth.
          </p>
        </div>
        <div className="text-xs text-mute sm:text-sm">
          Signed in as{" "}
          <span className="text-cloud">{adminEmail ?? "admin"}</span>
        </div>
      </header>

      <AdminCommandStrip
        items={NAV}
        onRefresh={refresh}
        refreshing={refreshing}
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.7rem] text-mute">
          Metrics range · hot lists stay{" "}
          <span className="text-cloud">today</span>
        </p>
        <div className="flex rounded-full border border-white/10 p-0.5">
          {(
            [
              ["today", "Today"],
              ["7d", "7d"],
              ["30d", "30d"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`rounded-full px-2.5 py-1 text-xs transition ${
                range === key
                  ? "bg-snow text-void"
                  : "text-mute hover:text-snow"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* LIVE + WATCH metrics — dense strip */}
      <section id="admin-live" className="scroll-mt-32">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[0.65rem] uppercase tracking-[0.16em] text-mute">
              Live · Watch
            </h2>
            <p className="mt-0.5 text-xs text-cloud">
              Heartbeats ~2 min · {ranged.rangeLabel}
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <AdminMetricCard
            tone="live"
            live={metrics.live_users > 0}
            label="Live now"
            value={metrics.live_users}
            hint={
              metrics.live_users > 0
                ? `${presence.length} listed · ${globePeople.length} on globe`
                : "Waiting for heartbeats…"
            }
          />
          <AdminMetricCard
            label="Hours watched"
            value={formatHours(ranged.watchSeconds)}
            hint={ranged.watchHint}
            spark={watchSpark}
          />
          <AdminMetricCard
            label="Unique visitors"
            value={metrics.unique_visitors_today}
            hint={`${newVisitors} new · ${metrics.returning_visitors_today} returning`}
          />
          <AdminMetricCard
            label="Page views"
            value={ranged.pageViews}
            hint={ranged.pageViewsHint}
            spark={viewsSpark}
          />
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 transition duration-300 hover:border-white/[0.14] sm:col-span-2 lg:col-span-1">
            <p className="text-[0.62rem] uppercase tracking-[0.14em] text-mute">
              Live paths
            </p>
            {liveNowPaths.length === 0 ? (
              <p className="mt-2 text-xs text-mute">No active paths</p>
            ) : (
              <ul className="mt-1.5 space-y-0.5">
                {liveNowPaths.slice(0, 4).map(({ path, people, n }) => (
                  <li key={path}>
                    <button
                      type="button"
                      onClick={() => openVisitor(people[0] ?? null)}
                      className="group flex w-full items-center justify-between gap-2 rounded-md px-1 py-0.5 text-left transition hover:bg-white/[0.04]"
                    >
                      <span className="truncate font-mono text-[0.65rem] text-cloud group-hover:text-snow">
                        {path}
                      </span>
                      <span className="shrink-0 tabular-nums text-[0.65rem] text-mute">
                        {n}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* GROWTH */}
      <section id="admin-growth" className="mt-5 scroll-mt-32">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[0.65rem] uppercase tracking-[0.16em] text-mute">
              Growth
            </h2>
            <p className="mt-0.5 text-xs text-cloud">
              Equity curves · cumulative over range
            </p>
          </div>
          <div className="flex rounded-full border border-white/10 p-0.5">
            {(["7", "14", "30"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCurveRange(key)}
                className={`rounded-full px-2.5 py-1 text-xs transition ${
                  curveRange === key
                    ? "bg-snow text-void"
                    : "text-mute hover:text-snow"
                }`}
              >
                {key}d
              </button>
            ))}
          </div>
        </div>

        <div className="mb-2 grid gap-2 sm:grid-cols-2">
          <AdminMetricCard
            label={range === "today" ? "Signups today" : `Signups · ${range}`}
            value={ranged.signups}
            hint={ranged.signupsHint}
            spark={signupSpark}
          />
          <AdminMetricCard
            label="Total accounts"
            value={metrics.total_signups}
            hint={avg7}
            spark={signupSpark}
          />
        </div>

        <div className="scroll-mt-32 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 transition duration-300 hover:border-white/[0.12] sm:p-4">
          <div className="mb-1">
            <h3 className="text-[0.95rem] tracking-[-0.02em] text-snow">
              Equity curves
            </h3>
            <p className="text-xs text-mute">
              Cumulative signups, page views, and watch hours · hover to scrub
            </p>
          </div>
          <AdminEquityCurve series={equitySeries} height={200} />
        </div>
      </section>

      {/* USERS — restored on-dashboard presence table */}
      <section
        id="admin-users"
        className="mt-5 scroll-mt-32 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 transition duration-300 hover:border-white/[0.12] sm:p-4"
      >
        <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[0.95rem] tracking-[-0.02em] text-snow">
              Live users
            </h2>
            <p className="text-xs text-mute">
              {presence.length} active · click a row for details
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[0.65rem] text-cloud">
            <span
              className={`h-1.5 w-1.5 rounded-full bg-snow ${
                metrics.live_users > 0 ? "admin-live-pulse" : "opacity-40"
              }`}
            />
            Presence
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-[0.65rem] uppercase tracking-[0.12em] text-mute">
              <tr className="border-b border-white/[0.06]">
                <th className="pb-2 pr-3 font-medium">Visitor</th>
                <th className="pb-2 pr-3 font-medium">Auth</th>
                <th className="pb-2 pr-3 font-medium">Place</th>
                <th className="pb-2 pr-3 font-medium">Path</th>
                <th className="pb-2 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {presence.slice(0, 48).map((p) => {
                const active = p.id === selectedId && drawerOpen;
                return (
                  <tr
                    key={p.id}
                    className={`cursor-pointer border-b border-white/[0.04] transition ${
                      active
                        ? "bg-white/[0.07] text-snow"
                        : "text-cloud hover:bg-white/[0.03] hover:text-snow"
                    }`}
                    onClick={() => openVisitor(p)}
                  >
                    <td className="py-2 pr-3">
                      <span className="block text-sm">{visitorLabel(p)}</span>
                      <span className="block text-[0.65rem] text-mute">
                        {p.email || "Anonymous"}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-wider ${
                          p.user_id
                            ? "border-white/15 text-cloud"
                            : "border-white/[0.08] text-mute"
                        }`}
                      >
                        {p.user_id ? "Signed in" : "Anon"}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-xs">
                      {[p.city, p.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="max-w-[14rem] truncate py-2 pr-3 font-mono text-xs">
                      {p.path || "/"}
                    </td>
                    <td className="py-2 text-xs tabular-nums">
                      {new Date(p.last_seen).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {presence.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-mute">
                    No live presence yet — open the site in another tab.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked list */}
        <ul className="space-y-1 md:hidden">
          {presence.slice(0, 48).map((p) => {
            const active = p.id === selectedId && drawerOpen;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => openVisitor(p)}
                  className={`flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition ${
                    active
                      ? "bg-white/[0.08] text-snow"
                      : "text-cloud hover:bg-white/[0.04] hover:text-snow"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm">{visitorLabel(p)}</span>
                    <span className="shrink-0 text-[0.6rem] uppercase tracking-wider text-mute">
                      {p.user_id ? "Signed in" : "Anon"}
                    </span>
                  </span>
                  <span className="truncate font-mono text-[0.65rem] text-mute">
                    {p.path || "/"}
                  </span>
                  <span className="flex justify-between gap-2 text-[0.65rem] text-mute">
                    <span>
                      {[p.city, p.country].filter(Boolean).join(", ") || "—"}
                    </span>
                    <span className="tabular-nums">
                      {new Date(p.last_seen).toLocaleTimeString()}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {presence.length === 0 ? (
            <li className="rounded-lg border border-dashed border-white/[0.08] px-3 py-5 text-center text-sm text-mute">
              No live presence yet.
            </li>
          ) : null}
        </ul>
      </section>

      {/* HOT */}
      <section id="admin-hot" className="mt-5 scroll-mt-32" aria-label="What's hot">
        <div className="mb-2">
          <h2 className="text-[0.95rem] tracking-[-0.02em] text-snow">
            What&apos;s hot
          </h2>
          <p className="text-xs text-mute">
            Ranked from watch ticks and page views · today
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <HotList
            title="Most watched"
            subtitle="By visible watch time today"
            items={topWatched}
            emptyTitle="Quiet on the player"
            emptyBody="No /watch time recorded yet today. Heat shows up as people stream."
          />
          <HotList
            title="Top pages"
            subtitle="By page views since midnight UTC"
            items={topPages}
            emptyTitle="No page heat yet"
            emptyBody="Views will rank here once traffic lands after midnight UTC."
          />
        </div>
      </section>

      {/* GLOBE */}
      <section
        id="admin-globe"
        className="mt-5 scroll-mt-32 grid gap-3 lg:grid-cols-[1.4fr_1fr]"
      >
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#070709] transition duration-300 hover:border-white/[0.12]">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse at 50% 18%, rgba(255,255,255,0.08), transparent 55%)",
            }}
            aria-hidden
          />
          <div className="relative flex items-center justify-between px-4 pt-3.5">
            <div>
              <h2 className="text-[0.95rem] tracking-[-0.02em] text-snow">
                Active visitors
              </h2>
              <p className="text-xs text-mute">
                {globePeople.length} geolocated · drag, zoom, click dots
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[0.65rem] text-cloud">
              <span
                className={`h-1.5 w-1.5 rounded-full bg-snow ${
                  metrics.live_users > 0 ? "admin-live-pulse" : "opacity-40"
                }`}
              />
              Live
            </span>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[480px]">
            {globePeople.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                <p className="text-sm text-cloud">Globe is quiet</p>
                <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-mute">
                  Live visitors with a known location appear as dots.
                </p>
              </div>
            ) : (
              <LiveGlobe
                people={globePeople}
                selectedId={selectedId}
                onSelect={onSelect}
                className="absolute inset-0"
              />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 transition duration-300 hover:border-white/[0.12] sm:p-4">
          <h2 className="text-[0.95rem] tracking-[-0.02em] text-snow">
            Top regions
          </h2>
          <p className="mb-3 text-xs text-mute">From live heartbeats</p>
          {topCountries.length === 0 ? (
            <div className="flex min-h-[6rem] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-black/20 px-4 text-center">
              <p className="text-sm text-cloud">No regions yet</p>
              <p className="mt-1 text-xs text-mute">
                Waiting for geolocated heartbeats.
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {topCountries.map(([country, count], index) => {
                const max = topCountries[0]?.[1] ?? 1;
                const width = Math.max(8, Math.round((count / max) * 100));
                return (
                  <li
                    key={country}
                    className="group flex items-center gap-3 rounded-lg px-1 py-1.5 transition hover:bg-white/[0.03]"
                  >
                    <span className="w-4 text-right text-[0.65rem] tabular-nums text-mute">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-cloud group-hover:text-snow">
                          {country}
                        </span>
                        <span className="tabular-nums text-snow">{count}</span>
                      </div>
                      <div className="h-0.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-white/35 transition group-hover:bg-white/55"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <div id="admin-members" className="scroll-mt-32">
        <BadgeManager />
      </div>

      <div id="admin-announcements" className="scroll-mt-32">
        <AnnouncementManager initialItems={announcements} />
      </div>

      <p className="mt-8 text-center text-[0.65rem] text-mute">
        Shortcuts ·{" "}
        <span className="text-cloud">1–7</span> jump ·{" "}
        <span className="text-cloud">R</span> refresh ·{" "}
        <Link href="/" className="text-cloud transition hover:text-snow">
          View site
        </Link>
      </p>

      <VisitorDrawer
        person={selected}
        open={drawerOpen}
        onClose={closeDrawer}
      />
    </div>
  );
}

export function AdminDashboard(props: AdminDashboardProps) {
  return (
    <AdminFeedbackProvider>
      <AdminDashboardInner {...props} />
    </AdminFeedbackProvider>
  );
}
