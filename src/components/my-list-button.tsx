"use client";

import { useEffect, useState } from "react";
import { isInMyList, toggleMyList } from "@/lib/mylist";

type Props = {
  id: number;
  slug: string;
  title: string;
  poster: string;
  className?: string;
};

export function MyListButton({
  id,
  slug,
  title,
  poster,
  className = "",
}: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isInMyList(id));
    const sync = () => setSaved(isInMyList(id));
    window.addEventListener("anikura:mylist", sync);
    return () => window.removeEventListener("anikura:mylist", sync);
  }, [id]);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from My List" : "Add to My List"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = toggleMyList({ id, slug, title, poster });
        setSaved(next);
      }}
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
