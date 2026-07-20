"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CinematicBackdrop } from "@/components/cinematic-backdrop";
import type { AniListMedia } from "@/lib/anilist";
import { stripHtml } from "@/lib/anilist";
import { animeHref, getGenres, watchHref } from "@/lib/anikoto";
import type { AnimeSummary } from "@/lib/types";

export type HeroSlide = {
  anime: AnimeSummary;
  anilist?: AniListMedia | null;
};

type Props = {
  slides: HeroSlide[];
};

export function Hero({ slides }: Props) {
  const playable = useMemo(
    () =>
      slides.filter(
        (s) =>
          s.anilist?.trailer?.site?.toLowerCase() === "youtube" &&
          s.anilist.trailer.id,
      ),
    [slides],
  );

  const queue = playable.length ? playable : slides.slice(0, 1);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (queue.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % queue.length);
    }, 28000);
    return () => clearInterval(timer);
  }, [queue.length]);

  const current = queue[index] || queue[0];
  if (!current) return null;

  const { anime, anilist } = current;
  const trailerId =
    anilist?.trailer?.site?.toLowerCase() === "youtube"
      ? anilist.trailer.id
      : null;

  // Only used when there's no trailer (fallback still)
  const bg =
    anilist?.bannerImage ||
    anime.background_image ||
    anilist?.coverImage?.extraLarge ||
    anime.poster;

  const description =
    stripHtml(anilist?.description).slice(0, 150) ||
    (anime.description
      ? anime.description.slice(0, 150) +
        (anime.description.length > 150 ? "…" : "")
      : "Cinematic anime, curated for a calmer watch.");

  const genres = (
    anilist?.genres?.length ? anilist.genres : getGenres(anime)
  ).slice(0, 2);

  const score =
    anilist?.averageScore != null
      ? (anilist.averageScore / 10).toFixed(1)
      : anime.score && anime.score !== "N/A"
        ? anime.score
        : null;

  const showTitle =
    anilist?.title.english || anilist?.title.romaji || anime.title;

  const titleLen = showTitle.length;
  const titleClass =
    titleLen > 48
      ? "max-w-xl text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.08] tracking-[-0.035em] line-clamp-3"
      : titleLen > 28
        ? "max-w-lg text-[clamp(2.1rem,6vw,3.75rem)] leading-[1.02] tracking-[-0.04em] line-clamp-3"
        : "max-w-[14ch] text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] tracking-[-0.05em]";

  return (
    <CinematicBackdrop
      key={`${anime.id}-${index}`}
      videoId={trailerId}
      posterSrc={bg}
      title={showTitle}
      scale={1.65}
    >
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1200px] flex-col justify-end px-5 pb-16 pt-28 sm:px-8 lg:pb-24">
        <p className="animate-rise text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-snow/70">
          Anikura
        </p>

        <h1
          className={`animate-rise mt-4 font-semibold text-snow ${titleClass}`}
          title={showTitle}
        >
          {showTitle}
        </h1>

        <p className="animate-rise mt-5 max-w-md text-[1.05rem] leading-relaxed text-cloud">
          {description}
          {description.length >= 150 ? "…" : ""}
        </p>

        <div className="animate-rise mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mute">
          {score && <span>{score}</span>}
          {(anilist?.seasonYear || anime.year) && (
            <span>{anilist?.seasonYear || anime.year}</span>
          )}
          {genres.map((g) => (
            <span key={g}>{g}</span>
          ))}
        </div>

        <div className="animate-rise mt-8 flex flex-wrap gap-3">
          <Link href={watchHref(anime, 1)} className="btn-primary">
            <span className="btn-icon" aria-hidden>
              <PlayIcon />
            </span>
            Play
          </Link>
          <Link href={animeHref(anime)} className="btn-ghost">
            More info
            <span className="btn-icon" aria-hidden>
              <ChevronIcon />
            </span>
          </Link>
        </div>

        {queue.length > 1 && (
          <div className="hero-dots mt-10" role="tablist" aria-label="Featured titles">
            {queue.map((slide, i) => (
              <button
                key={slide.anime.id}
                type="button"
                role="tab"
                aria-label={`Show ${slide.anime.title}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
                className="hero-dot"
              />
            ))}
          </div>
        )}
      </div>
    </CinematicBackdrop>
  );
}

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4.2 2.4v11.2L14 8 4.2 2.4Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
