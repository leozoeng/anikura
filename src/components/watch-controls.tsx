"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ANIKURA_DISCORD_INVITE } from "@/lib/discord-partners";

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

      <Pill
        href={ANIKURA_DISCORD_INVITE}
        external
        title="Updates & feedback"
      >
        <DiscordIcon />
        Discord
      </Pill>

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
  external,
  title,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  external?: boolean;
  title?: string;
}) {
  const className = `inline-flex items-center gap-1.5 rounded-full bg-raised px-3.5 py-2 text-sm font-medium tracking-[-0.01em] text-cloud ring-1 ring-white/10 transition ${
    disabled
      ? "cursor-not-allowed opacity-45"
      : "hover:bg-white/10 hover:text-snow"
  }`;

  if (href && !disabled) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={title}
          className={className}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} title={title} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={className}
    >
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

function DiscordIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
