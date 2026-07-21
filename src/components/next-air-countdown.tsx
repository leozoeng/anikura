"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  /** Unix timestamp in seconds */
  airsAt: number;
  episode?: number | null;
  className?: string;
};

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

function split(ms: number): Parts {
  const totalMs = Math.max(0, ms);
  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, totalMs };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function NextAirCountdown({ airsAt, episode, className = "" }: Props) {
  const targetMs = airsAt * 1000;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [airsAt]);

  const parts = useMemo(() => split(targetMs - now), [targetMs, now]);

  if (parts.totalMs <= 0) {
    return (
      <div
        className={`overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-3.5 py-3 ${className}`.trim()}
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-mute">
          Next episode
          {episode ? ` · ${episode}` : ""}
        </p>
        <p className="mt-1.5 text-sm font-medium tracking-[-0.02em] text-snow">
          Airing now — refresh to watch
        </p>
      </div>
    );
  }

  const units: { label: string; value: string }[] = [
    { label: "Days", value: pad(parts.days) },
    { label: "Hours", value: pad(parts.hours) },
    { label: "Min", value: pad(parts.minutes) },
    { label: "Sec", value: pad(parts.seconds) },
  ];

  // Under 24h, drop days to keep focus on the tighter clock.
  const shown = parts.days > 0 ? units : units.slice(1);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-white/[0.07] to-transparent ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-mute">
            Next up
          </p>
          <p className="mt-0.5 truncate text-sm font-medium tracking-[-0.02em] text-snow">
            {episode ? `Episode ${episode}` : "New episode"}
          </p>
        </div>
        <span
          className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-cloud ring-1 ring-white/12"
          aria-hidden
        >
          <span className="absolute inset-1.5 rounded-full bg-snow/15 animate-pulse" />
          <ClockIcon />
        </span>
      </div>

      <div
        className="grid gap-1.5 px-3 py-3"
        style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}
        aria-label={`Airing in ${parts.days} days ${parts.hours} hours ${parts.minutes} minutes ${parts.seconds} seconds`}
      >
        {shown.map((unit, i) => (
          <div key={unit.label} className="relative text-center">
            {i > 0 ? (
              <span
                aria-hidden
                className="pointer-events-none absolute -left-1 top-[0.85rem] text-sm font-medium text-mute/50"
              >
                :
              </span>
            ) : null}
            <div className="rounded-xl bg-black/45 px-1 py-2 ring-1 ring-white/[0.08]">
              <p className="font-semibold tabular-nums tracking-[-0.04em] text-snow text-[1.15rem] leading-none sm:text-[1.25rem]">
                {unit.value}
              </p>
            </div>
            <p className="mt-1.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-mute">
              {unit.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle
        cx="8"
        cy="8"
        r="5.25"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M8 5.25V8l2 1.25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
