"use client";

import { useCallback, useMemo, useState } from "react";
import {
  LiveGlobe,
  type GlobePerson,
} from "@/components/admin/live-globe";
import { AnnouncementManager } from "@/components/admin/announcement-manager";
import { BadgeManager } from "@/components/admin/badge-manager";
import { MoodArtManager } from "@/components/admin/mood-art-manager";
import type { SocialAnnouncement } from "@/lib/announcements";

export type DashboardMetrics = {
  live_users: number;
  total_signups: number;
  signups_today: number;
  signups_7d: number;
  page_views_today: number;
  page_views_7d: number;
  sessions_live: number;
  unique_visitors_today: number;
  returning_visitors_today: number;
  watch_seconds_today: number;
};

export type PresencePoint = GlobePerson;

export type SignupDay = {
  day: string;
  signups: number;
};

type AdminDashboardProps = {
  metrics: DashboardMetrics;
  presence: PresencePoint[];
  series: SignupDay[];
  adminEmail: string | null;
  moodOverrides: Record<string, string>;
  announcements: SocialAnnouncement[];
};

type RangeKey = "7" | "14" | "30";

function formatHours(seconds: number) {
  const h = seconds / 3600;
  if (h < 0.1) return `${Math.round(seconds / 60)}m`;
  return `${h.toFixed(h >= 10 ? 0 : 1)}h`;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition duration-300 hover:border-white/[0.16] hover:bg-white/[0.05]">
      <p className="text-[0.7rem] uppercase tracking-[0.16em] text-mute">
        {label}
      </p>
      <p className="mt-2 text-3xl tracking-[-0.04em] text-snow tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-cloud opacity-0 transition group-hover:opacity-100">
          {hint}
        </p>
      ) : (
        <p className="mt-1 text-xs text-transparent">.</p>
      )}
    </div>
  );
}

function SignupChart({ series }: { series: SignupDay[] }) {
  const max = Math.max(1, ...series.map((d) => d.signups));

  return (
    <div className="flex h-40 items-end gap-1.5">
      {series.map((d) => {
        const height = Math.max(4, Math.round((d.signups / max) * 100));
        const label = d.day.slice(5);
        return (
          <div
            key={d.day}
            className="group relative flex flex-1 flex-col items-center justify-end"
          >
            <div className="pointer-events-none absolute -top-7 rounded bg-black/80 px-1.5 py-0.5 text-[0.65rem] text-snow opacity-0 transition group-hover:opacity-100">
              {d.signups}
            </div>
            <div
              className="w-full rounded-t-sm bg-gradient-to-t from-white/15 to-white/55 transition duration-300 group-hover:to-white/80"
              style={{ height: `${height}%` }}
              title={`${d.day}: ${d.signups}`}
            />
            <span className="mt-2 text-[0.6rem] text-mute">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function VisitorCard({
  person,
  onClear,
}: {
  person: PresencePoint;
  onClear: () => void;
}) {
  const place =
    [person.city, person.country].filter(Boolean).join(", ") || "Unknown place";
  const name =
    person.nickname?.trim() ||
    person.email?.split("@")[0] ||
    (person.user_id ? "Signed-in guest" : "Anonymous");

  return (
    <div className="rounded-2xl border border-white/[0.12] bg-black/55 p-4 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-mute">
            Selected
          </p>
          <p className="mt-1 text-lg tracking-[-0.03em] text-snow">{name}</p>
          <p className="mt-0.5 text-sm text-cloud">{place}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-mute transition hover:border-white/25 hover:text-snow"
        >
          Clear
        </button>
      </div>
      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-mute">Path</dt>
          <dd className="max-w-[14rem] truncate font-mono text-xs text-snow">
            {person.path || "/"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-mute">Account</dt>
          <dd className="truncate text-cloud">
            {person.email || "Not signed in"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-mute">Session</dt>
          <dd className="font-mono text-xs text-cloud">
            {(person.session_id || "—").slice(0, 10)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-mute">Last seen</dt>
          <dd className="text-xs text-cloud">
            {new Date(person.last_seen).toLocaleString()}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-mute">Coords</dt>
          <dd className="font-mono text-xs tabular-nums text-cloud">
            {person.lat.toFixed(2)}, {person.lng.toFixed(2)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function AdminDashboard({
  metrics,
  presence,
  series,
  adminEmail,
  moodOverrides,
  announcements,
}: AdminDashboardProps) {
  const [range, setRange] = useState<RangeKey>("14");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredSeries = useMemo(() => {
    const n = Number(range);
    return series.slice(-n);
  }, [range, series]);

  const selected = useMemo(
    () => presence.find((p) => p.id === selectedId) ?? null,
    [presence, selectedId],
  );

  const onSelect = useCallback((person: GlobePerson | null) => {
    setSelectedId(person?.id ?? null);
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

  const newVisitors =
    metrics.unique_visitors_today - metrics.returning_visitors_today;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-24 sm:px-6">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-mute">
            Anikura · Admin
          </p>
          <h1 className="mt-1 text-3xl tracking-[-0.04em] text-snow sm:text-4xl">
            Night desk
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-cloud">
            Explore the globe, open visitor dots, and read today&apos;s traffic
            at a glance.
          </p>
        </div>
        <div className="text-sm text-mute">
          Signed in as{" "}
          <span className="text-cloud">{adminEmail ?? "admin"}</span>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Live now"
          value={metrics.live_users}
          hint="Heartbeats in the last ~2 minutes"
        />
        <MetricCard
          label="Hours watched today"
          value={formatHours(metrics.watch_seconds_today)}
          hint="Visible time on /watch pages"
        />
        <MetricCard
          label="Unique visitors"
          value={metrics.unique_visitors_today}
          hint={`${Math.max(0, newVisitors)} new · ${metrics.returning_visitors_today} returning`}
        />
        <MetricCard
          label="Returning visitors"
          value={metrics.returning_visitors_today}
          hint="Saw the site before today"
        />
      </section>

      <section className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total signups"
          value={metrics.total_signups}
          hint="All registered accounts"
        />
        <MetricCard
          label="Signups today"
          value={metrics.signups_today}
          hint="Since midnight UTC"
        />
        <MetricCard
          label="Page views today"
          value={metrics.page_views_today}
          hint={`${metrics.page_views_7d} in the last 7 days`}
        />
        <MetricCard
          label="Sessions live"
          value={metrics.sessions_live}
          hint="Active browser sessions"
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070709]">
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
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-snow" />
              Live
            </span>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[560px]">
            <LiveGlobe
              people={presence}
              selectedId={selectedId}
              onSelect={onSelect}
              className="absolute inset-0"
            />
            {selected ? (
              <div className="absolute left-3 right-3 top-3 z-10 sm:left-auto sm:right-4 sm:w-[17.5rem]">
                <VisitorCard
                  person={selected}
                  onClear={() => setSelectedId(null)}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg tracking-[-0.02em] text-snow">
                  Signups
                </h2>
                <p className="text-sm text-mute">
                  {metrics.signups_7d} in the last 7 days
                </p>
              </div>
              <div className="flex rounded-full border border-white/10 p-0.5">
                {(["7", "14", "30"] as RangeKey[]).map((key) => (
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
                    {key}d
                  </button>
                ))}
              </div>
            </div>
            <SignupChart series={filteredSeries} />
          </div>

          <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <h2 className="text-lg tracking-[-0.02em] text-snow">
              Top regions
            </h2>
            <p className="mb-4 text-sm text-mute">From live heartbeats</p>
            {topCountries.length === 0 ? (
              <p className="text-sm text-mute">
                Waiting for visitors… open the site in another tab.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {topCountries.map(([country, count]) => (
                  <li
                    key={country}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-cloud">{country}</span>
                    <span className="tabular-nums text-snow">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <BadgeManager />

      <AnnouncementManager initialItems={announcements} />

      <MoodArtManager initialOverrides={moodOverrides} />

      <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h2 className="text-lg tracking-[-0.02em] text-snow">
          Recent presence
        </h2>
        <p className="mb-4 text-sm text-mute">
          Click a row to focus that visitor on the globe
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[0.7rem] uppercase tracking-[0.12em] text-mute">
              <tr className="border-b border-white/[0.06]">
                <th className="pb-2 pr-3 font-medium">Visitor</th>
                <th className="pb-2 pr-3 font-medium">Location</th>
                <th className="pb-2 pr-3 font-medium">Path</th>
                <th className="pb-2 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {presence.slice(0, 40).map((p) => {
                const active = p.id === selectedId;
                const label =
                  p.nickname?.trim() ||
                  p.email?.split("@")[0] ||
                  (p.user_id ? "Signed in" : "Guest");
                return (
                  <tr
                    key={p.id}
                    className={`cursor-pointer border-b border-white/[0.04] transition ${
                      active
                        ? "bg-white/[0.07] text-snow"
                        : "text-cloud hover:bg-white/[0.03] hover:text-snow"
                    }`}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <td className="py-2.5 pr-3">
                      <span className="block">{label}</span>
                      <span className="block text-[0.7rem] text-mute">
                        {p.email || "Anonymous"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      {[p.city, p.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs">
                      {p.path || "/"}
                    </td>
                    <td className="py-2.5 text-xs">
                      {new Date(p.last_seen).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {presence.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-mute">
                    No live dots yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
