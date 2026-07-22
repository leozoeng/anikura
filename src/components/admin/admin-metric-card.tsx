"use client";

import { AdminSparkline } from "@/components/admin/admin-sparkline";

type MetricCardProps = {
  label: string;
  value: string | number;
  hint: string;
  spark?: number[];
  tone?: "default" | "live";
  live?: boolean;
};

export function AdminMetricCard({
  label,
  value,
  hint,
  spark,
  tone = "default",
  live = false,
}: MetricCardProps) {
  const isLive = tone === "live" || live;

  return (
    <div
      className={`admin-metric group relative overflow-hidden rounded-xl border px-3 py-2.5 transition duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-px hover:border-white/[0.18] hover:bg-white/[0.055] focus-within:border-white/[0.2] ${
        isLive
          ? "border-white/[0.14] bg-white/[0.05]"
          : "border-white/[0.08] bg-white/[0.03]"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 42%, transparent 100%)",
        }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isLive ? (
            <span
              className={`relative flex h-1.5 w-1.5 ${
                typeof value === "number" && value > 0
                  ? "admin-live-pulse"
                  : ""
              }`}
            >
              <span className="absolute inset-0 rounded-full bg-snow/70 opacity-60" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-snow" />
            </span>
          ) : null}
          <p className="text-[0.62rem] uppercase tracking-[0.14em] text-mute">
            {label}
          </p>
        </div>
        {spark && spark.length >= 2 ? (
          <AdminSparkline values={spark} active={isLive} />
        ) : null}
      </div>
      <p className="relative mt-1 text-2xl tracking-[-0.04em] text-snow tabular-nums transition duration-300 sm:text-[1.65rem]">
        {value}
      </p>
      <p className="relative mt-0.5 text-[0.7rem] leading-snug text-cloud">{hint}</p>
    </div>
  );
}
