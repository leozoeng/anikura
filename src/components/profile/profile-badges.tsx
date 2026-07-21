"use client";

import type { ReactNode } from "react";
import { type ProfileBadgeId } from "@/lib/profile";

/** Shared glyph metrics — sized for crisp icon chips. */
function BadgeIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const BADGE_META: Record<
  ProfileBadgeId,
  { label: string; title: string; className: string; icon: ReactNode }
> = {
  og: {
    label: "OG",
    title: "Original member",
    className:
      "border-white/25 bg-[#1c1c1e] text-snow/90 ring-white/10",
    icon: (
      <BadgeIcon>
        {/* Soft-filled star — founding-member mark */}
        <path
          d="M8 1.4l1.85 3.95 4.3.45-3.25 2.95.95 4.2L8 10.85 4.15 12.95l.95-4.2L1.85 5.8l4.3-.45L8 1.4z"
          fill="currentColor"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </BadgeIcon>
    ),
  },
  partner: {
    label: "Partner",
    title: "Official partner",
    className:
      "border-emerald-400/30 bg-[#14201a] text-emerald-100/90 ring-emerald-400/10",
    icon: (
      <BadgeIcon>
        {/* Interlocking rings — partnership / alliance */}
        <circle
          cx="5.6"
          cy="8"
          r="3.45"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <circle
          cx="10.4"
          cy="8"
          r="3.45"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </BadgeIcon>
    ),
  },
  dev: {
    label: "Dev",
    title: "Developer",
    className:
      "border-sky-400/25 bg-[#1a2330] text-sky-200/90 ring-sky-400/10",
    icon: (
      <BadgeIcon>
        {/* Balanced chevrons + slash — code glyph */}
        <path
          d="M5.75 3.9 2.2 8l3.55 4.1"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.25 3.9 13.8 8l-3.55 4.1"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.2 3.25 6.8 12.75"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          opacity="0.72"
        />
      </BadgeIcon>
    ),
  },
  vip: {
    label: "VIP",
    title: "VIP member",
    className:
      "border-amber-400/30 bg-[#2a2418] text-amber-100/90 ring-amber-400/10",
    icon: (
      <BadgeIcon>
        {/* Three-peak crown with jewel — premium VIP */}
        <path
          d="M2.35 11.55h11.3v1.05c0 .45-.36.8-.8.8H3.15a.8.8 0 0 1-.8-.8v-1.05z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path
          d="M2.35 11.55 3.6 5.7l2.5 2.85L8 3.55l1.9 5 2.5-2.85 1.25 5.85H2.35z"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8.2" r="0.9" fill="currentColor" />
        <path
          d="M2.35 11.55h11.3"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </BadgeIcon>
    ),
  },
};

type Props = {
  badges: ProfileBadgeId[];
  /** Compact for peek cards */
  size?: "sm" | "md";
  className?: string;
};

export function ProfileBadges({
  badges,
  size = "md",
  className = "",
}: Props) {
  if (!badges.length) return null;

  const chip =
    size === "sm"
      ? "h-[1.25rem] w-[1.25rem] rounded-[0.3rem]"
      : "h-[1.4rem] w-[1.4rem] rounded-[0.35rem]";
  const gap = size === "sm" ? "gap-1" : "gap-1.5";
  const iconScale =
    size === "sm" ? "[&_svg]:h-[11px] [&_svg]:w-[11px]" : "[&_svg]:h-[13px] [&_svg]:w-[13px]";

  return (
    <span
      className={`inline-flex flex-wrap items-center ${gap} ${className}`}
      aria-label="Profile badges"
    >
      {badges.map((id) => {
        const meta = BADGE_META[id];
        if (!meta) return null;
        return (
          <span
            key={id}
            className="group relative inline-flex"
          >
            <span
              tabIndex={0}
              title={meta.title}
              aria-label={meta.title}
              className={`inline-flex items-center justify-center border ring-1 outline-none transition focus-visible:ring-2 focus-visible:ring-white/35 ${chip} ${iconScale} ${meta.className}`}
            >
              {meta.icon}
            </span>
            {/* Discord-like tooltip: dark, rounded, caret — hover + keyboard focus */}
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 -translate-x-1/2 scale-95 whitespace-nowrap rounded-[5px] bg-[#111214] px-2 py-[5px] text-[11px] font-medium leading-none tracking-[-0.01em] text-[#f2f3f5] opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.45)] transition duration-100 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100"
            >
              {meta.title}
              <span
                aria-hidden
                className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-[#111214]"
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}
