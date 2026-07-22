"use client";

type AdminSparklineProps = {
  values: number[];
  className?: string;
  active?: boolean;
};

/** Compact 7-point (or n) sparkline — quiet ops chrome, no axes. */
export function AdminSparkline({
  values,
  className = "",
  active = false,
}: AdminSparklineProps) {
  if (values.length < 2) return null;

  const w = 72;
  const h = 22;
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 2 - ((v - min) / span) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const d = `M ${pts.join(" L ")}`;
  const last = values[values.length - 1] ?? 0;
  const lastX = w;
  const lastY = h - 2 - ((last - min) / span) * (h - 4);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`overflow-visible ${className}`}
      width={w}
      height={h}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke={active ? "rgba(245,245,247,0.75)" : "rgba(245,245,247,0.35)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-[stroke] duration-300"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r={1.75}
        fill={active ? "rgba(245,245,247,0.95)" : "rgba(245,245,247,0.55)"}
      />
    </svg>
  );
}
