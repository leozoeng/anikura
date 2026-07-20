"use client";

import Image from "next/image";
import Link from "next/link";
import type { AnimeSummary, CatalogAnime } from "@/lib/types";
import { animeHref } from "@/lib/anikoto";
import { MyListButton } from "./my-list-button";

type Props = {
  anime: AnimeSummary | CatalogAnime;
  priority?: boolean;
  className?: string;
  progress?: number;
  episodeLabel?: string;
  href?: string;
  showMyList?: boolean;
};

export function AnimePoster({
  anime,
  priority,
  className = "",
  progress,
  episodeLabel,
  href,
  showMyList = true,
}: Props) {
  return (
    <Link
      href={href || animeHref(anime)}
      className={`group relative block ${className}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-[1.1rem] bg-raised ring-1 ring-white/8 transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:ring-[#ff8caa]/35 group-hover:shadow-[0_24px_50px_rgba(0,0,0,0.55)]">
        <Image
          src={anime.poster}
          alt={anime.title}
          fill
          sizes="(max-width: 768px) 42vw, 180px"
          priority={priority}
          className="object-cover transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

        {showMyList && (
          <MyListButton
            id={anime.id}
            slug={anime.slug}
            title={anime.title}
            poster={anime.poster}
            className="absolute right-2 top-2 z-10 opacity-0 transition group-hover:opacity-100"
          />
        )}

        {typeof progress === "number" && progress > 0 && (
          <div className="absolute inset-x-3 bottom-3 h-[2px] overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${Math.min(100, Math.max(4, progress))}%` }}
            />
          </div>
        )}
      </div>

      <div className="mt-3 space-y-0.5 px-0.5">
        <h3 className="line-clamp-2 text-[0.8125rem] font-medium leading-snug tracking-[-0.02em] text-snow transition group-hover:text-white">
          {anime.title}
        </h3>
        {episodeLabel ? (
          <p className="text-[0.75rem] text-mute">{episodeLabel}</p>
        ) : anime.score && anime.score !== "N/A" ? (
          <p className="text-[0.75rem] text-mute">{anime.score}</p>
        ) : null}
      </div>
    </Link>
  );
}
