"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  AdminCommandStrip,
  type AdminNavItem,
} from "@/components/admin/admin-command-strip";
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
  { id: "admin-watch", label: "Watch", shortcut: "2" },
  { id: "admin-growth", label: "Growth", shortcut: "3" },
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

function SignupChart({
  series,
  activeDay,
  onSelectDay,
}: {
  series: SignupDay[];
  activeDay: string | null;
  onSelectDay: (day: string | null) => void;
}) {
  const max = Math.max(1, ...series.map((d) => d.signups));
  const total = series.reduce((sum, d) => sum + d.signups, 0);

  if (series.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-black/20 text-center">
        <p className="text-sm text-cloud">No signup history yet</p>
        <p className="mt-1 text-xs text-mute">
          Bars appear as accounts land over the selected range.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-xs text-mute">
          {activeDay ? (
            <>
              <span className="text-cloud">{activeDay}</span>
              {" · "}
              <span className="tabular-nums text-snow">
                {series.find((d) => d.day === activeDay)?.signups ?? 0}
              </span>{" "}
              signups
            </>
          ) : (
            <>
              <span className="tabular-nums text-cloud">{total}</span> across
              range · click a bar
            </>
          )}
        </p>
        {activeDay ? (
          <button
            type="button"
            onClick={() => onSelectDay(null)}
            className="text-[0.65rem] uppercase tracking-[0.12em] text-mute transition hover:text-snow"
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="flex h-40 items-end gap-1.5">
        {series.map((d) => {
          const height = Math.max(4, Math.round((d.signups / max) * 100));
          const label = d.day.slice(5);
          const active = activeDay === d.day;
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => onSelectDay(active ? null : d.day)}
              className="group relative flex flex-1 flex-col items-center justify-end outline-none"
              aria-pressed={active}
              aria-label={`${d.day}: ${d.signups} signups`}
            >
              <span
                className={`pointer-events-none absolute -top-7 rounded-md border border-white/10 bg-black/85 px-1.5 py-0.5 text-[0.65rem] tabular-nums text-snow transition ${
                  active
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                }`}
              >
                {d.signups}
              </span>
              <span
                className={`w-full rounded-t-sm transition duration-300 ${
                  active
                    ? "bg-gradient-to-t from-white/25 to-white/90"
                    : "bg-gradient-to-t from-white/12 to-white/45 group-hover:to-white/70 group-focus-visible:to-white/70"
                }`}
                style={{ height: `${height}%` }}
              />
              <span
                className={`mt-2 text-[0.6rem] ${
                  active ? "text-snow" : "text-mute"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
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
  const [chartRange, setChartRange] = useState<"7" | "14" | "30">("14");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const { refresh, refreshing } = useAdminManualRefresh();

  const selected = useMemo(
    () => presence.find((p) => p.id === selectedId) ?? null,
    [presence, selectedId],
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

  const filteredSeries = useMemo(() => {
    const n = Number(chartRange);
    return lastN(series, n);
  }, [chartRange, series]);

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
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-24 sm:px-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-mute">
            Anikura · Admin
          </p>
          <h1 className="mt-1 text-3xl tracking-[-0.04em] text-snow sm:text-4xl">
            Night desk
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-cloud">
            Live ops console — presence, audience, and growth in one quiet desk.
          </p>
        </div>
        <div className="text-sm text-mute">
          Signed in as{" "}
          <span className="text-cloud">{adminEmail ?? "admin"}</span>
        </div>
      </header>

      <AdminCommandStrip
        items={NAV}
        onRefresh={refresh}
        refreshing={refreshing}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-mute">
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
              className={`rounded-full px-3 py-1.5 text-xs transition ${
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

      {/* LIVE */}
      <section id="admin-live" className="scroll-mt-36">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[0.7rem] uppercase tracking-[0.16em] text-mute">
              Live
            </h2>
            <p className="mt-0.5 text-sm text-cloud">
              Heartbeats in the last ~2 minutes
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminMetricCard
            tone="live"
            live={metrics.live_users > 0}
            label="Live now"
            value={metrics.live_users}
            hint={
              metrics.live_users > 0
                ? `${presence.length} on the globe · click a path below`
                : "Waiting for heartbeats…"
            }
          />
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition duration-300 hover:border-white/[0.14]">
            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-mute">
              Live paths
            </p>
            {liveNowPaths.length === 0 ? (
              <div className="mt-3 flex min-h-[4.5rem] items-center">
                <p className="text-sm text-mute">
                  No active paths — open the site in another tab to seed the
                  ticker.
                </p>
              </div>
            ) : (
              <ul className="mt-3 space-y-1">
                {liveNowPaths.map(({ path, people, n }) => (
                  <li key={path}>
                    <button
                      type="button"
                      onClick={() => openVisitor(people[0] ?? null)}
                      className="group flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.04]"
                    >
                      <span className="truncate font-mono text-xs text-cloud group-hover:text-snow">
                        {path}
                      </span>
                      <span className="shrink-0 tabular-nums text-xs text-mute group-hover:text-cloud">
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

      {/* WATCH / AUDIENCE */}
      <section id="admin-watch" className="mt-8 scroll-mt-36">
        <div className="mb-3">
          <h2 className="text-[0.7rem] uppercase tracking-[0.16em] text-mute">
            Watch · Audience
          </h2>
          <p className="mt-0.5 text-sm text-cloud">
            {ranged.rangeLabel} · unique visitors always show today
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminMetricCard
            label="Hours watched"
            value={formatHours(ranged.watchSeconds)}
            hint={ranged.watchHint}
            spark={watchSpark}
          />
          <AdminMetricCard
            label="Unique visitors"
            value={metrics.unique_visitors_today}
            hint={`${newVisitors} new · ${metrics.returning_visitors_today} returning · today`}
          />
          <AdminMetricCard
            label="Page views"
            value={ranged.pageViews}
            hint={ranged.pageViewsHint}
            spark={viewsSpark}
          />
        </div>
      </section>

      {/* GROWTH */}
      <section id="admin-growth" className="mt-8 scroll-mt-36">
        <div className="mb-3">
          <h2 className="text-[0.7rem] uppercase tracking-[0.16em] text-mute">
            Growth
          </h2>
          <p className="mt-0.5 text-sm text-cloud">
            Accounts and signup momentum
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
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

        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition duration-300 hover:border-white/[0.12]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base tracking-[-0.02em] text-snow">
                Signup chart
              </h3>
              <p className="text-sm text-mute">
                {metrics.signups_7d} in the last 7 days
              </p>
            </div>
            <div className="flex rounded-full border border-white/10 p-0.5">
              {(["7", "14", "30"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setChartRange(key);
                    setActiveDay(null);
                  }}
                  className={`rounded-full px-2.5 py-1 text-xs transition ${
                    chartRange === key
                      ? "bg-snow text-void"
                      : "text-mute hover:text-snow"
                  }`}
                >
                  {key}d
                </button>
              ))}
            </div>
          </div>
          <SignupChart
            series={filteredSeries}
            activeDay={activeDay}
            onSelectDay={setActiveDay}
          />
        </div>
      </section>

      {/* HOT */}
      <section id="admin-hot" className="mt-8 scroll-mt-36" aria-label="What's hot">
        <div className="mb-3">
          <h2 className="text-lg tracking-[-0.02em] text-snow">What&apos;s hot</h2>
          <p className="text-sm text-mute">
            Ranked from real watch ticks and page views · today only
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
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
        className="mt-8 scroll-mt-36 grid gap-4 lg:grid-cols-[1.4fr_1fr]"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070709] transition duration-300 hover:border-white/[0.12]">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse at 50% 18%, rgba(255,255,255,0.08), transparent 55%)",
            }}
            aria-hidden
          />
          <div className="relative flex items-center justify-between px-5 pt-5">
            <div>
              <h2 className="text-lg tracking-[-0.02em] text-snow">
                Active visitors
              </h2>
              <p className="text-sm text-mute">
                {presence.length} geolocated · drag, zoom, click dots
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-cloud">
              <span
                className={`h-1.5 w-1.5 rounded-full bg-snow ${
                  metrics.live_users > 0 ? "admin-live-pulse" : "opacity-40"
                }`}
              />
              Live
            </span>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[560px]">
            {presence.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                <p className="text-sm text-cloud">Globe is quiet</p>
                <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-mute">
                  Live visitors with a known location appear as dots. Open the
                  public site to seed presence.
                </p>
              </div>
            ) : (
              <LiveGlobe
                people={presence}
                selectedId={selectedId}
                onSelect={onSelect}
                className="absolute inset-0"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition duration-300 hover:border-white/[0.12]">
            <h2 className="text-lg tracking-[-0.02em] text-snow">Top regions</h2>
            <p className="mb-4 text-sm text-mute">From live heartbeats</p>
            {topCountries.length === 0 ? (
              <div className="flex min-h-[8rem] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-black/20 px-4 text-center">
                <p className="text-sm text-cloud">No regions yet</p>
                <p className="mt-1 text-xs text-mute">
                  Waiting for geolocated heartbeats.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
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

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition duration-300 hover:border-white/[0.12]">
            <h2 className="text-base tracking-[-0.02em] text-snow">
              Recent presence
            </h2>
            <p className="mb-3 text-sm text-mute">
              Tap a row to open the visitor drawer
            </p>
            {presence.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.08] bg-black/20 px-3 py-6 text-center text-sm text-mute">
                No live dots yet.
              </div>
            ) : (
              <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
                {presence.slice(0, 24).map((p) => {
                  const active = p.id === selectedId && drawerOpen;
                  const label =
                    p.nickname?.trim() ||
                    p.email?.split("@")[0] ||
                    (p.user_id ? "Signed in" : "Guest");
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => openVisitor(p)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition ${
                          active
                            ? "bg-white/[0.08] text-snow"
                            : "text-cloud hover:bg-white/[0.04] hover:text-snow"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm">{label}</span>
                          <span className="block truncate font-mono text-[0.65rem] text-mute">
                            {p.path || "/"}
                          </span>
                        </span>
                        <span className="shrink-0 text-[0.65rem] text-mute">
                          {[p.city, p.country].filter(Boolean).join(", ") || "—"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <div id="admin-members" className="scroll-mt-36">
        <BadgeManager />
      </div>

      <div id="admin-announcements" className="scroll-mt-36">
        <AnnouncementManager initialItems={announcements} />
      </div>

      <p className="mt-10 text-center text-[0.7rem] text-mute">
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
