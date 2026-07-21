"use client";

import type { ReactNode } from "react";
import { type ProfileBadgeId } from "@/lib/profile";

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
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 3l2.2 6.7H21l-5.4 3.9 2.1 6.4L12 16.6 6.3 20l2.1-6.4L3 9.7h6.8L12 3z" />
      </svg>
    ),
  },
  dev: {
    label: "Dev",
    title: "Developer",
    className:
      "border-sky-400/25 bg-[#1a2330] text-sky-200/90 ring-sky-400/10",
    icon: (
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M8 9l-4 3 4 3" />
        <path d="M16 9l4 3-4 3" />
        <path d="M14 5l-4 14" />
      </svg>
    ),
  },
  vip: {
    label: "VIP",
    title: "VIP member",
    className:
      "border-amber-400/30 bg-[#2a2418] text-amber-100/90 ring-amber-400/10",
    icon: (
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M5 16l-1.5-8 4.5 3.5L12 5l4 6.5L20.5 8 19 16H5zm0 2h14v2H5v-2z" />
      </svg>
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

  const pad = size === "sm" ? "px-1.5 py-0.5 text-[0.58rem]" : "px-2 py-0.5 text-[0.62rem]";
  const gap = size === "sm" ? "gap-1" : "gap-1.5";

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
            title={meta.title}
            className={`inline-flex items-center gap-1 rounded-md border font-semibold uppercase tracking-[0.06em] ring-1 ${pad} ${meta.className}`}
          >
            {meta.icon}
            {meta.label}
          </span>
        );
      })}
    </span>
  );
}
