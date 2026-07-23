"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  AdminCommandStrip,
  type AdminNavItem,
} from "@/components/admin/admin-command-strip";
import { AdminDeskRangeControl } from "@/components/admin/admin-desk-range";
import {
  AdminEquityCurve,
  type EquitySeries,
} from "@/components/admin/admin-equity-curve";
import { AdminFeedbackProvider } from "@/components/admin/admin-feedback";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { useAdminManualRefresh } from "@/components/admin/admin-refresh";
import { BadgeManager } from "@/components/admin/badge-manager";
import { HotList } from "@/components/admin/hot-list";
import {
  LiveGlobe,
  type GlobePerson,
} from "@/components/admin/live-globe";
import {
  LivePresenceTable,
  type LivePresencePerson,
} from "@/components/admin/live-presence-table";
import { VisitorDrawer } from "@/components/admin/visitor-drawer";
import type { HotListItem } from "@/lib/admin-hot-paths";
import {
  deskRangeLabel,
  sliceByDeskRange,
  sumField,
  type DeskRange,
  utcTodayKey,
} from "@/lib/admin-desk-range";
import { adminDisplayName, adminIdentityDetail } from "@/lib/profile";

export type DashboardMetrics = {
  live_users: number;
  total_signups: number;
  signups_today: number;
  signups_7d: number;
  page_views_today: number;
  page_views_7d: number;
  sessions_today: number;
  sessions_7d: number;
  sessions_30d: number;
  unique_visitors_today: number;
  returning_visitors_today: number;
  watch_seconds_today: number;
};

export type PresencePoint = LivePresencePerson;

export type SignupDay = {
  day: string;
  signups: number;
};

export type ActivityDay = {
  day: string;
  page_views: number;
  sessions: number;
  watch_seconds: number;
};

type AdminDashboardProps = {
  metrics: DashboardMetrics;
  presence: PresencePoint[];
  series: SignupDay[];
  activity: ActivityDay[];
  adminEmail: string | null;
  topPages: HotListItem[];
  topWatched: HotListItem[];
};

const NAV: AdminNavItem[] = [
  { id: "overview", label: "Overview", shortcut: "1" },
  { id: "growth", label: "Growth", shortcut: "2" },
  { id: "hot", label: "What's hot", shortcut: "3" },
  { id: "globe", label: "Globe", shortcut: "4" },
  { id: "members", label: "Members", shortcut: "5" },
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

function visitorLabel(p: PresencePoint) {
  return adminDisplayName(
    {
      nickname: p.nickname,
      username: p.username,
      email: p.email,
      user_id: p.user_id,
    },
    "Guest",
  );
}

function visitorDetail(p: PresencePoint) {
  return adminIdentityDetail({
    username: p.username,
    email: p.email,
    user_id: p.user_id,
  });
}

function AdminDashboardInner({
  metrics,
  presence,
  series,
  activity,
  adminEmail,
  topPages,
  topWatched,
}: AdminDashboardProps) {
  const [tab, setTab] = useState(NAV[0]!.id);
  const [deskRange, setDeskRange] = useState<DeskRange>({
    kind: "preset",
    days: 7,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { refresh, refreshing } = useAdminManualRefresh();

  const dayBounds = useMemo(() => {
    const days = [
      ...series.map((d) => d.day),
      ...activity.map((d) => d.day),
    ].sort();
    return {
      minDay: days[0] ?? utcTodayKey(),
      maxDay: days[days.length - 1] ?? utcTodayKey(),
    };
  }, [activity, series]);

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

  const rangeSlice = useMemo(() => {
    return {
      signups: sliceByDeskRange(series, deskRange),
      activity: sliceByDeskRange(activity, deskRange),
    };
  }, [activity, deskRange, series]);

  const equitySeries = useMemo((): EquitySeries[] => {
    const watchHours = rangeSlice.activity.map((d) => ({
      day: d.day,
      value: Math.round((d.watch_seconds / 3600) * 10) / 10,
    }));
    return [
      {
        id: "signups",
        label: "Signups",
        color: "rgba(245,245,247,0.92)",
        fill: "rgba(245,245,247,0.28)",
        points: rangeSlice.signups.map((d) => ({
          day: d.day,
          value: d.signups,
        })),
      },
      {
        id: "views",
        label: "Page views",
        color: "rgba(200,210,230,0.9)",
        fill: "rgba(200,210,230,0.25)",
        points: rangeSlice.activity.map((d) => ({
          day: d.day,
          value: d.page_views,
        })),
      },
      {
        id: "sessions",
        label: "Sessions",
        color: "rgba(220,200,210,0.9)",
        fill: "rgba(220,200,210,0.25)",
        points: rangeSlice.activity.map((d) => ({
          day: d.day,
          value: d.sessions,
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
  }, [rangeSlice]);

  const sparkSource = useMemo(() => {
    if (deskRange.kind === "day") {
      return {
        signups: rangeSlice.signups.map((d) => d.signups),
        views: rangeSlice.activity.map((d) => d.page_views),
        sessions: rangeSlice.activity.map((d) => d.sessions),
        watch: rangeSlice.activity.map((d) => d.watch_seconds),
      };
    }
    const n = Math.min(deskRange.days, 15);
    return {
      signups: lastN(series, n).map((d) => d.signups),
      views: lastN(activity, n).map((d) => d.page_views),
      sessions: lastN(activity, n).map((d) => d.sessions),
      watch: lastN(activity, n).map((d) => d.watch_seconds),
    };
  }, [activity, deskRange, rangeSlice, series]);

  const ranged = useMemo(() => {
    const label = deskRangeLabel(deskRange);
    const signups = sumField(rangeSlice.signups, (d) => d.signups);
    const pageViews = sumField(rangeSlice.activity, (d) => d.page_views);
    const sessions = sumField(rangeSlice.activity, (d) => d.sessions);
    const watchSeconds = sumField(rangeSlice.activity, (d) => d.watch_seconds);
    const days =
      deskRange.kind === "day" ? 1 : Math.max(1, rangeSlice.activity.length);

    if (deskRange.kind === "day") {
      return {
        signups,
        signupsHint: `${label} · UTC`,
        pageViews,
        pageViewsHint: `${label} · UTC`,
        sessions,
        sessionsHint: "Distinct browsers that day",
        watchSeconds,
        watchHint: "Visible /watch time that day",
        rangeLabel: label,
        days: 1,
      };
    }

    if (deskRange.days === 1) {
      const yDate = new Date();
      yDate.setUTCDate(yDate.getUTCDate() - 1);
      const yKey = yDate.toISOString().slice(0, 10);
      const yCount = series.find((d) => d.day === yKey)?.signups;
      const todaySignups =
        rangeSlice.signups[0]?.signups ?? metrics.signups_today;
      return {
        signups: todaySignups,
        signupsHint: (() => {
          if (yCount == null) return `${metrics.signups_7d} in last 7 days`;
          if (yCount === todaySignups) {
            return `Same as yesterday · ${metrics.signups_7d} in 7d`;
          }
          return `${formatSigned(todaySignups - yCount)} vs yesterday · ${metrics.signups_7d} in 7d`;
        })(),
        pageViews:
          rangeSlice.activity[0]?.page_views ?? metrics.page_views_today,
        pageViewsHint: "Since midnight UTC",
        sessions: rangeSlice.activity[0]?.sessions ?? metrics.sessions_today,
        sessionsHint: "Distinct browsers today",
        watchSeconds:
          rangeSlice.activity[0]?.watch_seconds ?? metrics.watch_seconds_today,
        watchHint: "Visible time on /watch today",
        rangeLabel: label,
        days: 1,
      };
    }

    return {
      signups,
      signupsHint: `~${(signups / days).toFixed(1)}/day · ${metrics.total_signups} total`,
      pageViews,
      pageViewsHint:
        pageViews > 0
          ? `~${Math.round(pageViews / days)}/day average`
          : "No views in range",
      sessions,
      sessionsHint:
        sessions > 0
          ? `~${Math.round(sessions / days)}/day · distinct browsers`
          : "No sessions in range",
      watchSeconds,
      watchHint: `Sum of visible /watch time · ${label.toLowerCase()}`,
      rangeLabel: label,
      days,
    };
  }, [deskRange, metrics, rangeSlice, series]);

  const rangeControl = (
    <AdminDeskRangeControl
      value={deskRange}
      onChange={setDeskRange}
      minDay={dayBounds.minDay}
      maxDay={dayBounds.maxDay}
    />
  );

  const pulseMetrics = (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard
        label="Signups"
        value={ranged.signups}
        hint={ranged.signupsHint}
        spark={sparkSource.signups}
      />
      <AdminMetricCard
        label="Page views"
        value={ranged.pageViews}
        hint={ranged.pageViewsHint}
        spark={sparkSource.views}
      />
      <AdminMetricCard
        label="Sessions"
        value={ranged.sessions}
        hint={ranged.sessionsHint}
        spark={sparkSource.sessions}
      />
      <AdminMetricCard
        label="Hours watched"
        value={formatHours(ranged.watchSeconds)}
        hint={ranged.watchHint}
        spark={sparkSource.watch}
      />
    </div>
  );

  return (
    <div className="page-shell pb-14 pt-20 sm:pb-16 sm:pt-[4.75rem]">
      <header className="mb-2.5 flex flex-col gap-1.5 sm:mb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-mute">
            Anikura · Admin
          </p>
          <h1 className="mt-0.5 text-2xl tracking-[-0.04em] text-snow sm:text-[1.85rem]">
            Night desk
          </h1>
          <p className="mt-1 max-w-xl text-xs text-cloud sm:text-sm">
            Live presence first — then growth, heat, and geography.
          </p>
        </div>
        <div className="text-xs text-mute sm:text-sm">
          Signed in as{" "}
          <span className="text-cloud">{adminEmail ?? "admin"}</span>
        </div>
      </header>

      <AdminCommandStrip
        items={NAV}
        activeId={tab}
        onChange={setTab}
        onRefresh={refresh}
        refreshing={refreshing}
      />

      <div
        key={tab}
        role="tabpanel"
        aria-labelledby={`admin-tab-${tab}`}
        className="admin-tab-panel min-h-[20rem]"
      >
        {tab === "overview" ? (
          <section aria-label="Overview" className="space-y-3">
            <LivePresenceTable
              people={presence}
              liveCount={metrics.live_users}
              selectedId={selectedId}
              drawerOpen={drawerOpen}
              onSelect={openVisitor}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-[0.65rem] uppercase tracking-[0.16em] text-mute">
                  Pulse
                </h2>
                <p className="mt-0.5 text-xs text-cloud">
                  {ranged.rangeLabel} · shared with Growth
                </p>
              </div>
              {rangeControl}
            </div>

            {pulseMetrics}

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 transition duration-300 hover:border-white/[0.12] sm:p-4">
              <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="text-[0.95rem] tracking-[-0.02em] text-snow">
                    Equity
                  </h3>
                  <p className="text-xs text-mute">
                    Cumulative over {ranged.rangeLabel.toLowerCase()} · scrub to
                    inspect
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("growth")}
                  className="text-[0.65rem] text-mute transition hover:text-snow"
                >
                  Open Growth →
                </button>
              </div>
              <AdminEquityCurve series={equitySeries} height={180} />
            </div>
          </section>
        ) : null}

        {tab === "growth" ? (
          <section className="space-y-3" aria-label="Growth">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-[0.95rem] tracking-[-0.02em] text-snow">
                  Growth
                </h2>
                <p className="text-xs text-mute">
                  Equity curves and period totals · {ranged.rangeLabel}
                </p>
              </div>
              {rangeControl}
            </div>

            {pulseMetrics}

            <div className="grid gap-2 sm:grid-cols-3">
              <AdminMetricCard
                label="Total accounts"
                value={metrics.total_signups}
                hint={
                  metrics.signups_7d / 7 >= 0.1
                    ? `${metrics.signups_7d} this week · ~${(metrics.signups_7d / 7).toFixed(1)}/day`
                    : `${metrics.signups_7d} in the last 7 days`
                }
                spark={sparkSource.signups}
              />
              <AdminMetricCard
                label="New / returning · today"
                value={`${Math.max(0, metrics.unique_visitors_today - metrics.returning_visitors_today)} · ${metrics.returning_visitors_today}`}
                hint="Distinct browsers since midnight UTC"
              />
              <AdminMetricCard
                label="Live now"
                value={metrics.live_users}
                hint={`${presence.length} listed · ${globePeople.length} on globe`}
                tone="live"
                live={metrics.live_users > 0}
              />
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 transition duration-300 hover:border-white/[0.12] sm:p-4">
              <div className="mb-1">
                <h3 className="text-[0.95rem] tracking-[-0.02em] text-snow">
                  Equity curves
                </h3>
                <p className="text-xs text-mute">
                  Cumulative signups, views, sessions, and watch hours · hover to
                  scrub
                </p>
              </div>
              <AdminEquityCurve series={equitySeries} height={260} />
            </div>
          </section>
        ) : null}

        {tab === "hot" ? (
          <section aria-label="What's hot">
            <div className="mb-2.5">
              <h2 className="text-[0.95rem] tracking-[-0.02em] text-snow">
                What&apos;s hot
              </h2>
              <p className="text-xs text-mute">
                Ranked from watch ticks and page views · today
              </p>
            </div>
            <div className="grid gap-2.5 lg:grid-cols-2">
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
        ) : null}

        {tab === "globe" ? (
          <section className="grid gap-2.5 lg:grid-cols-[1.4fr_1fr]">
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

            <div className="space-y-2.5">
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
                              <span className="tabular-nums text-snow">
                                {count}
                              </span>
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

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 transition duration-300 hover:border-white/[0.12] sm:p-4">
                <h3 className="text-[0.8rem] tracking-[-0.02em] text-snow">
                  Signed in here
                </h3>
                <p className="mb-2 text-xs text-mute">From this presence window</p>
                <ul className="space-y-1">
                  {presence
                    .filter((p) => p.user_id)
                    .slice(0, 6)
                    .map((p) => {
                      const detail = visitorDetail(p);
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => openVisitor(p)}
                            className="flex w-full flex-col rounded-lg px-1.5 py-1.5 text-left transition hover:bg-white/[0.04]"
                          >
                            <span className="truncate text-sm text-snow">
                              {visitorLabel(p)}
                            </span>
                            <span className="truncate text-[0.65rem] text-mute">
                              {detail || "Signed in"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  {presence.filter((p) => p.user_id).length === 0 ? (
                    <li className="py-3 text-center text-xs text-mute">
                      No signed-in visitors right now
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "members" ? <BadgeManager /> : null}
      </div>

      <p className="mt-7 text-center text-[0.65rem] text-mute">
        Shortcuts ·{" "}
        <span className="text-cloud">1–5</span> switch tabs ·{" "}
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
