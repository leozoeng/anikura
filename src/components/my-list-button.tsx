"use client";

import { useEffect, useState } from "react";
import { isInMyList, toggleMyList } from "@/lib/mylist";

type Props = {
  id: number;
  slug: string;
  title: string;
  poster: string;
  className?: string;
  /** Compact icon button vs full pill label */
  variant?: "icon" | "pill";
};

export function MyListButton({
  id,
  slug,
  title,
  poster,
  className = "",
  variant = "icon",
}: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isInMyList(id));
    const sync = () => setSaved(isInMyList(id));
    window.addEventListener("anikura:mylist", sync);
    return () => window.removeEventListener("anikura:mylist", sync);
  }, [id]);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleMyList({ id, slug, title, poster });
    setSaved(next);
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        aria-label={saved ? "Remove from My List" : "Add to My List"}
        onClick={onClick}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tracking-[-0.01em] transition ${
          saved
            ? "bg-raised text-snow ring-1 ring-white/15 hover:bg-white/10"
            : "bg-white text-black hover:bg-white/90"
        } ${className}`}
      >
        {saved ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M3.5 8.5 6.5 11.5 12.5 4.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
        <span className={saved ? "text-snow" : "text-black"}>
          {saved ? "In My List" : "Add to List"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from My List" : "Add to My List"}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-full backdrop-blur-md transition ${
        saved
          ? "bg-snow text-void"
          : "bg-black/50 text-snow hover:bg-black/70"
      } ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M8 13.5 2.5 8.5c-1.5-1.5-1.5-4 0-5.5s4-1.5 5.5 0L8 4.5l1-1c1.5-1.5 4-1.5 5.5 0s1.5 4 0 5.5L8 13.5Z" />
      </svg>
    </button>
  );
}
