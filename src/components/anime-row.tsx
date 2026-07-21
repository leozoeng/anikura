"use client";

import Link from "next/link";
import { useRef } from "react";
import type { AnimeSummary } from "@/lib/types";
import { AnimePoster } from "./anime-poster";

type Props = {
  title: string;
  subtitle?: string;
  href?: string;
  anime: AnimeSummary[];
};

export function AnimeRow({ title, subtitle, href, anime }: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  if (!anime.length) return null;

  function scrollBy(dir: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(640, el.clientWidth * 0.85), behavior: "smooth" });
  }

  return (
    <section className="group/row relative space-y-5">
      <div className="flex w-full items-end justify-between gap-4 px-3 sm:px-4">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-sub">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="link-quiet text-sm">
            See all →
          </Link>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          className="absolute left-2 top-[28%] z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-snow opacity-0 backdrop-blur transition group-hover/row:opacity-100 hover:bg-black/80 md:grid"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          className="absolute right-2 top-[28%] z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-snow opacity-0 backdrop-blur transition group-hover/row:opacity-100 hover:bg-black/80 md:grid"
        >
          ›
        </button>

        <div
          ref={scroller}
          className="fade-x scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-3 pb-2 sm:gap-5 sm:px-4"
        >
          {anime.map((item, i) => (
            <div
              key={item.id}
              className="w-[118px] shrink-0 snap-start sm:w-[156px]"
            >
              <AnimePoster anime={item} priority={i < 5} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
