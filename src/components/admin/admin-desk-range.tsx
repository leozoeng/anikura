"use client";

import {
  DESK_RANGE_PRESETS,
  type DeskRange,
  type DeskRangePreset,
  utcTodayKey,
} from "@/lib/admin-desk-range";

type AdminDeskRangeControlProps = {
  value: DeskRange;
  onChange: (next: DeskRange) => void;
  /** Inclusive ISO day bounds for the custom picker (UTC). */
  minDay?: string;
  maxDay?: string;
  className?: string;
};

export function AdminDeskRangeControl({
  value,
  onChange,
  minDay,
  maxDay,
  className = "",
}: AdminDeskRangeControlProps) {
  const today = maxDay ?? utcTodayKey();
  const earliest = minDay ?? today;
  const customValue = value.kind === "day" ? value.date : "";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      role="group"
      aria-label="Desk time range"
    >
      <div className="flex rounded-full border border-white/10 p-0.5">
        {DESK_RANGE_PRESETS.map(({ days, label }) => {
          const active =
            value.kind === "preset" && value.days === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() =>
                onChange({ kind: "preset", days: days as DeskRangePreset })
              }
              className={`rounded-full px-2.5 py-1 text-xs transition duration-200 ease-[var(--ease-out-soft)] ${
                active
                  ? "bg-snow text-void"
                  : "text-mute hover:text-snow"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <label className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs text-mute transition hover:border-white/20 hover:text-cloud">
        <span className={value.kind === "day" ? "text-snow" : ""}>Day</span>
        <input
          type="date"
          value={customValue || today}
          min={earliest}
          max={today}
          onChange={(e) => {
            const date = e.target.value;
            if (!date) return;
            onChange({ kind: "day", date });
          }}
          className="cursor-pointer bg-transparent text-xs text-cloud outline-none [color-scheme:dark]"
          aria-label="Pick a specific day"
        />
      </label>
    </div>
  );
}
