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
      coverMode={trailerId ? "solid" : "poster"}
      posterClassName={trailerId ? "" : "opacity-60"}
    >
      <div className="relative mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-14 sm:flex-row sm:items-end sm:px-8">
        <div className="relative mx-auto h-[280px] w-[190px] shrink-0 overflow-hidden rounded-[1.25rem] ring-1 ring-white/15 sm:mx-0 sm:h-[340px] sm:w-[230px]">
          <Image
            src={poster}
            alt={title}
            fill
            className="object-cover"
            sizes="230px"
            priority
          />
        </div>

        <div className="min-w-0 flex-1 pb-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-mute">
              {status || "Series"}
            </p>
          </div>
          <h1 className="mt-3 text-[clamp(2.2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
            {title}
          </h1>
          {native && (
            <p className="mt-2 font-[family-name:var(--font-jp)] text-cloud">
              {native}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-mute">
            {score && <span>{score}</span>}
            {year && <span>{year}</span>}
            {episodeCount && <span>{episodeCount} episodes</span>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {genres.map((g) => (
              <Link
                key={g}
                href={`/genres/${slugifyGenre(g)}`}
                className="rounded-full border border-white/12 px-3 py-1 text-xs text-cloud transition hover:border-white/30 hover:text-snow"
              >
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
