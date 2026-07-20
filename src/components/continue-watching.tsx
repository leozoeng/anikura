"use client";

import { useEffect, useState } from "react";
import { AnimePoster } from "@/components/anime-poster";
import {
  clearContinueWatching,
  getContinueWatching,
  type WatchProgress,
} from "@/lib/progress";

export function ContinueWatching() {
  const [items, setItems] = useState<WatchProgress[]>([]);

  useEffect(() => {
    setItems(getContinueWatching());
    const sync = () => setItems(getContinueWatching());
    window.addEventListener("anikura:progress", sync);
    return () => window.removeEventListener("anikura:progress", sync);
  }, []);

  if (!items.length) return null;

  return (
    <section className="space-y-5">
      <div className="flex w-full items-end justify-between gap-4 px-3 sm:px-4">
        <div>
          <h2 className="section-title">Continue</h2>
          <p className="section-sub">Pick up where you left off</p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearContinueWatching();
            setItems([]);
          }}
          className="link-quiet text-sm"
        >
          Clear
        </button>
      </div>

      <div className="fade-x scrollbar-none flex gap-4 overflow-x-auto px-3 pb-2 sm:gap-5 sm:px-4">
        {items.map((item) => (
          <div key={item.id} className="w-[138px] shrink-0 sm:w-[156px]">
            <AnimePoster
              href={`/watch/${item.id}/${item.slug}?ep=${item.episode}&lang=${item.language}`}
              anime={{
                id: item.id,
                slug: item.slug,
                title: item.title,
                poster: item.poster,
              }}
              episodeLabel={`Episode ${item.episode}`}
              progress={item.percent}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
