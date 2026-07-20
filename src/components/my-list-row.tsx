"use client";

import { useEffect, useState } from "react";
import { AnimePoster } from "@/components/anime-poster";
import { getMyList, removeFromMyList } from "@/lib/mylist";
import { getLatestProgressForAnime } from "@/lib/progress";
import { watchHref } from "@/lib/anikoto";

export function MyListRow() {
  const [items, setItems] = useState(getMyList());

  useEffect(() => {
    const sync = () => setItems(getMyList());
    sync();
    window.addEventListener("anikura:mylist", sync);
    return () => window.removeEventListener("anikura:mylist", sync);
  }, []);

  if (!items.length) return null;

  return (
    <section className="space-y-5">
      <div className="mx-auto flex max-w-[1200px] items-end justify-between gap-4 px-5 sm:px-8">
        <div>
          <h2 className="section-title">My List</h2>
          <p className="section-sub">Saved for later</p>
        </div>
      </div>

      <div className="fade-x scrollbar-none flex gap-4 overflow-x-auto px-5 pb-2 sm:gap-5 sm:px-8">
        {items.map((item) => {
          const latest = getLatestProgressForAnime(item.id);
          const href = latest
            ? watchHref(
                { id: item.id, slug: item.slug },
                latest.episode,
                latest.language,
              )
            : undefined;
          return (
            <div key={item.id} className="relative w-[138px] shrink-0 sm:w-[156px]">
              <AnimePoster
                href={href}
                anime={{
                  id: item.id,
                  slug: item.slug,
                  title: item.title,
                  poster: item.poster,
                }}
                progress={latest?.percent}
                episodeLabel={
                  latest ? `Ep ${latest.episode}` : undefined
                }
              />
              <button
                type="button"
                aria-label="Remove from My List"
                onClick={() => removeFromMyList(item.id)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-xs text-cloud hover:text-snow"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
