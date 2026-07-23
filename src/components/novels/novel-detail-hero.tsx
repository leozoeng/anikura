"use client";

import { ExpandableText } from "@/components/expandable-text";
import { SafeImage } from "@/components/safe-image";
import { CinematicBackdrop } from "@/components/cinematic-backdrop";
import {
  formatNovelRating,
  formatNovelViews,
  novelReadHref,
} from "@/lib/novelbuddy";
import type { NovelChapter, NovelDetail } from "@/lib/novel-types";
import Link from "next/link";

type Props = {
  novel: NovelDetail;
  firstChapter: NovelChapter | null;
  latestChapter: NovelChapter | null;
};

export function NovelDetailHero({
  novel,
  firstChapter,
  latestChapter,
}: Props) {
  const score = formatNovelRating(novel.rating);
  const views = formatNovelViews(novel.views);
  const cover = novel.cover;
  const banner = cover || "";
  const authors = novel.authors.map((a) => a.name).filter(Boolean);
  const startHref = firstChapter
    ? novelReadHref(novel.id, firstChapter.id)
    : null;
  const continueHref = latestChapter
    ? novelReadHref(novel.id, latestChapter.id)
    : null;

  return (
    <CinematicBackdrop
      posterSrc={banner}
      title={novel.title}
      minHeightClass="min-h-[58vh] pt-16"
      scale={1.55}
      posterClassName="opacity-55"
    >
      <div className="page-shell relative flex flex-col gap-8 py-14 sm:flex-row sm:items-end">
        <div className="relative mx-auto h-[280px] w-[190px] shrink-0 overflow-hidden rounded-[1.35rem] shadow-[0_24px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/15 sm:mx-0 sm:h-[340px] sm:w-[230px]">
          {cover ? (
            <SafeImage
              src={cover}
              alt={novel.title}
              fill
              className="object-cover transition duration-700 hover:scale-[1.03]"
              sizes="230px"
              priority
            />
          ) : null}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
          />
        </div>

        <div className="min-w-0 flex-1 animate-rise pb-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-[clamp(2.2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
              {novel.title}
            </h1>
            <span className="inline-flex shrink-0 items-center gap-2 self-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-mute uppercase backdrop-blur-md">
              <span className="sakura-dot h-1.5 w-1.5 rounded-full bg-sakura" />
              {novel.status || "Novel"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-mute">
            {score ? (
              <span className="text-snow/90">
                {score}
                <span className="text-mute"> / 10</span>
              </span>
            ) : null}
            {novel.chaptersCount ? (
              <span>{novel.chaptersCount.toLocaleString()} chapters</span>
            ) : null}
            {views ? <span>{views} views</span> : null}
          </div>

          {authors.length ? (
            <p className="mt-3 text-sm text-cloud">
              {authors.slice(0, 4).join(" · ")}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {novel.genres.slice(0, 8).map((g) => (
              <span key={g.id} className="chip">
                {g.name}
              </span>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {startHref ? (
              <Link href={startHref} className="btn-primary">
                Start reading
              </Link>
            ) : null}
            {continueHref && continueHref !== startHref ? (
              <Link href={continueHref} className="btn-ghost">
                Latest chapter
              </Link>
            ) : null}
          </div>

          {novel.summary ? (
            <div className="mt-7 max-w-2xl text-[0.95rem] leading-relaxed text-cloud">
              <ExpandableText text={novel.summary} limit={420} />
            </div>
          ) : null}
        </div>
      </div>
    </CinematicBackdrop>
  );
}
