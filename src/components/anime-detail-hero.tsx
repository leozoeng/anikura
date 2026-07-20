"use client";

import Image from "next/image";
import Link from "next/link";
import { CinematicBackdrop } from "@/components/cinematic-backdrop";
import { slugifyGenre, watchHref } from "@/lib/anikoto";
import type { AnimeSummary, Episode } from "@/lib/types";

type Props = {
  title: string;
  native?: string | null;
  poster: string;
  banner: string;
  trailerId?: string | null;
  status?: string | null;
  score?: string | null;
  year?: number | null;
  episodeCount?: string | number | null;
  genres: string[];
  anime: AnimeSummary;
  episodes: Episode[];
  hasDub: boolean;
};

export function AnimeDetailHero({
  title,
  native,
  poster,
  banner,
  trailerId,
  status,
  score,
  year,
  episodeCount,
  genres,
  anime,
  episodes,
  hasDub,
}: Props) {
  return (
    <CinematicBackdrop
      videoId={trailerId}
      posterSrc={banner}
      title={title}
      minHeightClass="min-h-[58vh] pt-16"
      scale={1.65}
      posterClassName={trailerId ? "" : "opacity-60"}
    >
      <div className="relative mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-14 sm:flex-row sm:items-end sm:px-8">
        <div className="relative mx-auto h-[280px] w-[190px] shrink-0 overflow-hidden rounded-[1.35rem] shadow-[0_24px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/15 sm:mx-0 sm:h-[340px] sm:w-[230px]">
          <Image
            src={poster}
            alt={title}
            fill
            className="object-cover transition duration-700 hover:scale-[1.03]"
            sizes="230px"
            priority
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
          />
        </div>

        <div className="min-w-0 flex-1 animate-rise pb-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-mute uppercase backdrop-blur-md">
            <span className="sakura-dot h-1.5 w-1.5 rounded-full bg-sakura" />
            {status || "Series"}
          </div>
          <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
            {title}
          </h1>
          {native && (
            <p className="mt-2 font-[family-name:var(--font-jp)] text-[1.05rem] text-sakura-soft/80">
              {native}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-mute">
            {score && (
              <span className="text-snow/90">
                {score}
                <span className="text-mute"> / 10</span>
              </span>
            )}
            {year && <span>{year}</span>}
            {episodeCount && <span>{episodeCount} episodes</span>}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {genres.map((g) => (
              <Link key={g} href={`/genres/${slugifyGenre(g)}`} className="chip">
                {g}
              </Link>
            ))}
          </div>

          {episodes[0] && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={watchHref(anime, episodes[0].number)}
                className="btn-primary"
              >
                Play episode {episodes[0].number}
              </Link>
              {hasDub && (
                <Link
                  href={watchHref(anime, episodes[0].number, "dub")}
                  className="btn-ghost"
                >
                  Play dub
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </CinematicBackdrop>
  );
}
