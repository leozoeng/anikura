"use client";

import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import type { AnimeSummary, CatalogAnime } from "@/lib/types";
import { animeHref } from "@/lib/anikoto";
import { preferHighResPoster } from "@/lib/cover-image";
import { formatPosterMeta, formatPosterScore } from "@/lib/poster-meta";
import { MyListButton } from "./my-list-button";

type Props = {
  anime: AnimeSummary | CatalogAnime;
  priority?: boolean;
  className?: string;
  progress?: number;
  episodeLabel?: string;
  href?: string;
  showMyList?: boolean;
  /** Stagger index for enter animation (grids / rows). */
  index?: number;
};

export function AnimePoster({
  anime,
  priority,
  className = "",
  progress,
  episodeLabel,
  href,
  showMyList = false,
  index,
}: Props) {
  const score = formatPosterScore(anime.score);
  const meta = formatPosterMeta({
    type: anime.terms_by_type?.type?.[0],
    year: anime.year,
    score: anime.score,
  });
  const delay =
    typeof index === "number"
      ? { animationDelay: `${Math.min(index, 14) * 18}ms` }
      : undefined;
  const posterSrc = preferHighResPoster(anime.poster);

  return (
    <Link
      href={href || animeHref(anime)}
      className={`poster-link group relative block ${className}`}
      style={delay}
    >
      <div className="poster-frame relative aspect-[2/3] overflow-hidden rounded-[1.1rem] bg-raised">
        {posterSrc ? (
          <SafeImage
            src={posterSrc}
            alt={anime.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 220px"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            className="poster-image object-cover"
          />
        ) : null}
        <div className="poster-veil absolute inset-0" />

        {score ? (
          <span className="poster-score absolute left-2.5 top-2.5 z-[1]">
            {score}
          </span>
        ) : null}

        {showMyList && (
          <MyListButton
            id={anime.id}
            slug={anime.slug}
            title={anime.title}
            poster={posterSrc || anime.poster}
            className="absolute right-2 top-2 z-10 opacity-0 transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-focus-within:opacity-100"
          />
        )}

        {typeof progress === "number" && progress > 0 && (
          <div className="absolute inset-x-3 bottom-3 z-[1] h-[2px] overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${Math.min(100, Math.max(4, progress))}%` }}
            />
          </div>
        )}
      </div>

      <div className="poster-meta mt-3 space-y-0.5 px-0.5">
        <h3 className="line-clamp-2 text-[0.8125rem] font-medium leading-snug tracking-[-0.02em] text-snow transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-sakura-mist">
          {anime.title}
        </h3>
        {episodeLabel ? (
          <p className="text-[0.75rem] text-mute">{episodeLabel}</p>
        ) : meta ? (
          <p className="text-[0.75rem] text-mute transition duration-300 group-hover:text-cloud">
            {meta}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
