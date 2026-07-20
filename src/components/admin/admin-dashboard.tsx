"use client";

import { useMemo, useState } from "react";
import { LiveGlobe, type GlobeMarker } from "@/components/admin/live-globe";

export type DashboardMetrics = {
  live_users: number;
  total_signups: number;
  signups_today: number;
  signups_7d: number;
  page_views_today: number;
  page_views_7d: number;
  sessions_live: number;
};

export type PresencePoint = {
  lat: number;
  lng: number;
  country: string | null;
  city: string | null;
  last_seen: string;
  path: string | null;
};

export type SignupDay = {
  day: string;
  signups: number;
};

type AdminDashboardProps = {
  metrics: DashboardMetrics;
  presence: PresencePoint[];
  series: SignupDay[];
  adminEmail: string | null;
};

type RangeKey = "7" | "14" | "30";

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
              className="w-full rounded-t-sm bg-gradient-to-t from-white/15 to-sakura/70 transition duration-300 group-hover:to-sakura"
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

export function AdminDashboard({
  metrics,
  presence,
  series,
  adminEmail,
}: AdminDashboardProps) {
  const [range, setRange] = useState<RangeKey>("14");

  const filteredSeries = useMemo(() => {
    const n = Number(range);
    return series.slice(-n);
  }, [range, series]);

  const markers: GlobeMarker[] = useMemo(() => {
    return presence
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => ({
        location: [p.lat, p.lng] as [number, number],
        size: 0.04 + Math.random() * 0.02,
      }));
  }, [presence]);

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
            Live presence, signups, and quiet traffic — sakura void, not a
            purple SaaS clone.
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
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070709]">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse at 50% 20%, rgba(255,140,170,0.1), transparent 55%)",
            }}
            aria-hidden
          />
          <div className="relative flex items-center justify-between px-5 pt-5">
            <div>
              <h2 className="text-lg tracking-[-0.02em] text-snow">
                Active visitors
              </h2>
              <p className="text-sm text-mute">
                {markers.length} geolocated · {metrics.sessions_live} sessions
                live
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-cloud">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sakura" />
              Live
            </span>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[520px]">
            <LiveGlobe markers={markers} className="absolute inset-0" />
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

      <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h2 className="text-lg tracking-[-0.02em] text-snow">
          Recent presence
        </h2>
        <p className="mb-4 text-sm text-mute">
          Coarse IP geo · refreshed on page load
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[0.7rem] uppercase tracking-[0.12em] text-mute">
              <tr className="border-b border-white/[0.06]">
                <th className="pb-2 pr-3 font-medium">Location</th>
                <th className="pb-2 pr-3 font-medium">Path</th>
                <th className="pb-2 pr-3 font-medium">Coords</th>
                <th className="pb-2 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {presence.slice(0, 24).map((p, i) => (
                <tr
                  key={`${p.lat}-${p.lng}-${p.last_seen}-${i}`}
                  className="border-b border-white/[0.04] text-cloud transition hover:bg-white/[0.03] hover:text-snow"
                >
                  <td className="py-2.5 pr-3">
                    {[p.city, p.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs">
                    {p.path || "/"}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs tabular-nums">
                    {p.lat.toFixed(2)}, {p.lng.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-xs">
                    {new Date(p.last_seen).toLocaleString()}
                  </td>
                </tr>
              ))}
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
