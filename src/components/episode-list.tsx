"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { decodeEntities } from "@/lib/anilist";
import { watchHref } from "@/lib/anikoto";
import type { AnimeSummary, Episode } from "@/lib/types";

const CHUNK = 50;

type Props = {
  anime: Pick<AnimeSummary, "id" | "slug">;
  episodes: Episode[];
  hasDub: boolean;
  fallbackImage: string;
  episodeThumbnails?: Record<number, string>;
};

function episodeLabel(ep: Episode) {
  const title = decodeEntities(ep.title);
  if (title && title !== `Episode ${ep.number}`) return title;
  return `Episode ${ep.number}`;
}

function EpisodeThumbnail({
  src,
  alt,
  hasScene,
}: {
  src: string;
  alt: string;
  hasScene: boolean;
}) {
  return (
    // Native img: AniList thumbs come from many CDNs (Crunchyroll, etc.)
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] ${
        hasScene ? "" : "opacity-70"
      }`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}

export function EpisodeList({
  anime,
  episodes,
  hasDub,
  fallbackImage,
  episodeThumbnails = {},
}: Props) {
  const ranges = useMemo(() => {
    if (!episodes.length) return [] as { start: number; end: number }[];
    const nums = episodes.map((e) => e.number);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const list: { start: number; end: number }[] = [];
    for (let start = min; start <= max; start += CHUNK) {
      list.push({ start, end: Math.min(start + CHUNK - 1, max) });
    }
    return list;
  }, [episodes]);

  const [rangeStart, setRangeStart] = useState(ranges[0]?.start ?? 1);

  const activeRange =
    ranges.find((r) => r.start === rangeStart) || ranges[0];

  const visible = useMemo(() => {
    if (!activeRange) return episodes;
    return episodes.filter(
      (e) => e.number >= activeRange.start && e.number <= activeRange.end,
    );
  }, [episodes, activeRange]);

  if (!episodes.length) {
    return <p className="mt-4 text-mute">Episode list unavailable.</p>;
  }

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="section-sub">
          {episodes.length} episode{episodes.length === 1 ? "" : "s"}
          {activeRange && ranges.length > 1
            ? ` · showing ${activeRange.start}–${activeRange.end}`
            : ""}
        </p>
      </div>

      {ranges.length > 1 && (
        <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1">
          {ranges.map((r) => {
            const active = r.start === activeRange?.start;
            return (
              <button
                key={`${r.start}-${r.end}`}
                type="button"
                onClick={() => setRangeStart(r.start)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm tracking-[-0.01em] transition ${
                  active
                    ? "bg-snow text-void"
                    : "border border-white/12 text-cloud hover:border-white/30 hover:text-snow"
                }`}
              >
                {r.start}–{r.end}
              </button>
            );
          })}
        </div>
      )}

      <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-7 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((ep) => {
          const label = episodeLabel(ep);
          const sceneThumb = episodeThumbnails[ep.number];
          const thumb = sceneThumb || fallbackImage;
          const epHasDub = Boolean(ep.embed_url?.dub);

          return (
            <li key={ep.id}>
              <article className="group flex h-full flex-col">
                <Link
                  href={watchHref(anime, ep.number)}
                  className="relative aspect-video overflow-hidden rounded-lg bg-raised ring-1 ring-white/8 transition group-hover:ring-white/20"
                  aria-label={`Play episode ${ep.number}: ${label}`}
                >
                  <EpisodeThumbnail
                    src={thumb}
                    alt=""
                    hasScene={Boolean(sceneThumb)}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80" />
                  <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-snow/90 backdrop-blur-sm">
                    Ep {ep.number}
                  </span>
                  <span className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-snow text-void shadow-lg">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M4.5 2.8v10.4L13.2 8 4.5 2.8Z" />
                      </svg>
                    </span>
                  </span>
                </Link>

                <div className="mt-2.5 min-w-0 px-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">
                    Episode {ep.number}
                  </p>
                  <Link
                    href={watchHref(anime, ep.number)}
                    className="mt-0.5 block outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    <p className="line-clamp-2 text-sm font-medium leading-snug tracking-[-0.02em] text-snow transition group-hover:text-white">
                      {label}
                    </p>
                  </Link>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Link
                      href={watchHref(anime, ep.number, "sub")}
                      className="rounded-md border border-white/12 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-cloud transition hover:border-white/30 hover:text-snow"
                    >
                      Sub
                    </Link>
                    {hasDub && epHasDub && (
                      <Link
                        href={watchHref(anime, ep.number, "dub")}
                        className="rounded-md border border-white/12 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-cloud transition hover:border-white/30 hover:text-snow"
                      >
                        Dub
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
