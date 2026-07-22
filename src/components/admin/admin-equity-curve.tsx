"use client";

import { useCallback, useMemo, useRef, useState } from "react";

export type EquitySeriesPoint = {
  day: string;
  value: number;
};

export type EquitySeries = {
  id: string;
  label: string;
  color: string;
  fill: string;
  points: EquitySeriesPoint[];
  format?: (n: number) => string;
};

type AdminEquityCurveProps = {
  series: EquitySeries[];
  height?: number;
};

function cumulative(points: EquitySeriesPoint[]): EquitySeriesPoint[] {
  let sum = 0;
  return points.map((p) => {
    sum += p.value;
    return { day: p.day, value: sum };
  });
}

function formatDefault(n: number) {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

/** Interactive cumulative growth curves with hover scrub. */
export function AdminEquityCurve({
  series,
  height = 220,
}: AdminEquityCurveProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(series[0]?.id ?? "");
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);

  const active = useMemo(
    () => series.find((s) => s.id === activeId) ?? series[0] ?? null,
    [activeId, series],
  );

  const cum = useMemo(
    () => (active ? cumulative(active.points) : []),
    [active],
  );

  const pad = { top: 16, right: 12, bottom: 28, left: 8 };
  const w = 640;
  const innerW = w - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxY = Math.max(1, ...cum.map((p) => p.value));
  const n = cum.length;

  const coords = useMemo(() => {
    if (n < 2) return [] as Array<{ x: number; y: number; day: string; value: number }>;
    return cum.map((p, i) => ({
      x: pad.left + (i / (n - 1)) * innerW,
      y: pad.top + innerH - (p.value / maxY) * innerH,
      day: p.day,
      value: p.value,
    }));
  }, [cum, innerH, innerW, maxY, n, pad.left, pad.top]);

  const pathD = useMemo(() => {
    if (coords.length < 2) return "";
    return coords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(" ");
  }, [coords]);

  const areaD = useMemo(() => {
    if (coords.length < 2) return "";
    const first = coords[0]!;
    const last = coords[coords.length - 1]!;
    const baseY = pad.top + innerH;
    return `${pathD} L ${last.x.toFixed(1)} ${baseY} L ${first.x.toFixed(1)} ${baseY} Z`;
  }, [coords, innerH, pad.top, pathD]);

  const onMove = useCallback(
    (clientX: number) => {
      const el = wrapRef.current;
      if (!el || n < 2) return;
      const rect = el.getBoundingClientRect();
      const rel = (clientX - rect.left) / rect.width;
      const idx = Math.round(rel * (n - 1));
      setScrubIndex(Math.max(0, Math.min(n - 1, idx)));
    },
    [n],
  );

  const scrub = scrubIndex != null ? coords[scrubIndex] : null;
  const fmt = active?.format ?? formatDefault;
  const end = coords[coords.length - 1];
  const rangeAdd = active
    ? active.points.reduce((s, p) => s + p.value, 0)
    : 0;

  if (!active || n === 0) {
    return (
      <div className="flex h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-black/20 text-center">
        <p className="text-sm text-cloud">No growth series yet</p>
        <p className="mt-1 text-xs text-mute">
          Curves appear as signups and traffic land.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 rounded-full border border-white/10 p-0.5">
          {series.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveId(s.id);
                setScrubIndex(null);
              }}
              className={`rounded-full px-2.5 py-1 text-xs transition ${
                activeId === s.id
                  ? "bg-snow text-void"
                  : "text-mute hover:text-snow"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-mute">
          {scrub ? (
            <>
              <span className="text-cloud">{scrub.day}</span>
              {" · "}
              <span className="tabular-nums text-snow">{fmt(scrub.value)}</span>
              {" cumulative"}
            </>
          ) : (
            <>
              <span className="tabular-nums text-cloud">{fmt(end?.value ?? 0)}</span>
              {" total · "}
              <span className="tabular-nums text-cloud">+{fmt(rangeAdd)}</span>
              {" in range · scrub to inspect"}
            </>
          )}
        </p>
      </div>

      <div
        ref={wrapRef}
        className="relative touch-none select-none"
        style={{ height }}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseLeave={() => setScrubIndex(null)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) onMove(t.clientX);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) onMove(t.clientX);
        }}
        onTouchEnd={() => setScrubIndex(null)}
        role="img"
        aria-label={`${active.label} cumulative equity curve`}
      >
        <svg
          viewBox={`0 0 ${w} ${height}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`eq-fill-${active.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={active.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={active.color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* subtle grid */}
          {[0.25, 0.5, 0.75].map((t) => {
            const y = pad.top + innerH * (1 - t);
            return (
              <line
                key={t}
                x1={pad.left}
                x2={w - pad.right}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            );
          })}

          {areaD ? (
            <path d={areaD} fill={`url(#eq-fill-${active.id})`} />
          ) : null}
          {pathD ? (
            <path
              d={pathD}
              fill="none"
              stroke={active.color}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {scrub ? (
            <>
              <line
                x1={scrub.x}
                x2={scrub.x}
                y1={pad.top}
                y2={pad.top + innerH}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={scrub.x}
                cy={scrub.y}
                r="4.5"
                fill="#0a0a0c"
                stroke={active.color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : end ? (
            <circle
              cx={end.x}
              cy={end.y}
              r="3.5"
              fill={active.color}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        {/* x labels */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-1 text-[0.6rem] text-mute">
          <span>{cum[0]?.day.slice(5)}</span>
          {n > 2 ? (
            <span>{cum[Math.floor((n - 1) / 2)]?.day.slice(5)}</span>
          ) : null}
          <span>{cum[n - 1]?.day.slice(5)}</span>
        </div>

        {scrub ? (
          <div
            className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-md border border-white/12 bg-black/90 px-2 py-1 text-[0.65rem] text-snow shadow-lg"
            style={{
              left: `${(scrub.x / w) * 100}%`,
            }}
          >
            <span className="block text-mute">{scrub.day}</span>
            <span className="tabular-nums">{fmt(scrub.value)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
