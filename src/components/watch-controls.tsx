"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Vote = "up" | "down" | null;

type Props = {
  animeId: number;
  episode: number;
  language: "sub" | "dub";
  hasSub: boolean;
  hasDub: boolean;
  subHref: string;
  dubHref: string;
  onServer?: () => void;
  onShare?: () => void;
};

function voteKey(animeId: number, episode: number) {
  return `anikura:vote:${animeId}:${episode}`;
}

/** Deterministic fake like count from anime + episode (stable across refresh). */
export function fakeLikeCount(animeId: number, episode: number) {
  let h = Math.imul(animeId ^ (episode * 2654435761), 2246822519);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489917);
  h ^= h >>> 16;
  const n = h >>> 0;
  return 180 + (n % 9740);
}

function formatCount(n: number) {
  if (n >= 1000) {
    const k = n / 1000;
    return k >= 10 ? `${Math.round(k)}k` : `${k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(n);
}

export function WatchControls({
  animeId,
  episode,
  language,
  hasSub,
  hasDub,
  subHref,
  dubHref,
  onServer,
  onShare,
}: Props) {
  const [vote, setVote] = useState<Vote>(null);
  const baseLikes = fakeLikeCount(animeId, episode);
  const displayLikes = baseLikes + (vote === "up" ? 1 : 0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(voteKey(animeId, episode));
      setVote(raw === "up" || raw === "down" ? raw : null);
    } catch {
      setVote(null);
    }
  }, [animeId, episode]);

  function setVoteValue(next: Vote) {
    const value = vote === next ? null : next;
    setVote(value);
    try {
      const key = voteKey(animeId, episode);
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  const langHref = language === "sub" ? dubHref : subHref;
  const canToggleLang =
    (language === "sub" && hasDub) || (language === "dub" && hasSub);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex overflow-hidden rounded-full bg-raised ring-1 ring-white/10">
        <button
          type="button"
          aria-label="Like"
          aria-pressed={vote === "up"}
          onClick={() => setVoteValue("up")}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm transition ${
            vote === "up" ? "bg-white/12 text-snow" : "text-cloud hover:text-snow"
          }`}
        >
          <ThumbUpIcon />
          <span className="tabular-nums text-xs font-medium tracking-[-0.01em]">
            {formatCount(displayLikes)}
          </span>
        </button>
        <span className="w-px self-stretch bg-white/10" aria-hidden />
        <button
          type="button"
          aria-label="Dislike"
          aria-pressed={vote === "down"}
          onClick={() => setVoteValue("down")}
          className={`inline-flex items-center px-3 py-2 text-sm transition ${
            vote === "down" ? "bg-white/12 text-snow" : "text-cloud hover:text-snow"
          }`}
        >
          <ThumbDownIcon />
        </button>
      </div>

      {canToggleLang && (
        <Pill href={langHref}>
          <MicIcon />
          {language === "sub" ? "Dub" : "Sub"}
        </Pill>
      )}

      {onServer && (
        <Pill onClick={onServer}>
          <ServerIcon />
          Server
        </Pill>
      )}

      {onShare && (
        <Pill onClick={onShare}>
          <ShareIcon />
          Share
        </Pill>
      )}

      <Pill disabled>
        <FlagIcon />
        Report
      </Pill>
    </div>
  );
}

function Pill({
  children,
  href,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const className = `inline-flex items-center gap-1.5 rounded-full bg-raised px-3.5 py-2 text-sm font-medium tracking-[-0.01em] text-cloud ring-1 ring-white/10 transition ${
    disabled
      ? "cursor-not-allowed opacity-45"
      : "hover:bg-white/10 hover:text-snow"
  }`;

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}

function ThumbUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M5.5 14H3.2A1.2 1.2 0 0 1 2 12.8V8.2A1.2 1.2 0 0 1 3.2 7h2.3m0 7V7m0 7h5.1a1.5 1.5 0 0 0 1.45-1.12l1.1-4.2A1.2 1.2 0 0 0 14 7H9.5V4.2A1.2 1.2 0 0 0 8.3 3L5.5 7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThumbDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10.5 2H12.8A1.2 1.2 0 0 1 14 3.2v4.6A1.2 1.2 0 0 1 12.8 9h-2.3m0-7v7m0-7H5.4A1.5 1.5 0 0 0 3.95 3.12l-1.1 4.2A1.2 1.2 0 0 0 4 9h4.5v2.8A1.2 1.2 0 0 0 9.7 13L12.5 9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="5.5" y="2" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M3.5 8a4.5 4.5 0 0 0 9 0M8 12.5V14"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="9" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="5" r="0.7" fill="currentColor" />
      <circle cx="5" cy="11" r="0.7" fill="currentColor" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 14.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M5.7 7.3 10.3 4.7M5.7 8.7l4.6 2.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3.5 13.5V2.5M3.5 2.5h7.2l-1.4 2.4 1.4 2.4H3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
