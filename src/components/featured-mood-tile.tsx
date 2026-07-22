import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { genreWash, moodAccent, moodCopy } from "@/lib/genre-moods";
import type { GenreStat } from "@/lib/types";

type Cover = { src: string; position?: string };

/** Large mosaic tiles for the top moods on /genres. */
export function FeaturedMoodTile({
  genre,
  cover,
  index,
}: {
  genre: GenreStat;
  cover?: Cover;
  index: number;
}) {
  const accent = moodAccent(genre.slug);
  const wash = genreWash(genre.slug);
  const copy = moodCopy(genre.slug);
  const isHero = index === 0;

  const layout = isHero
    ? "genre-tile sm:col-span-2 lg:col-span-7 lg:row-span-2 min-h-[12rem] sm:min-h-[18rem] lg:min-h-[22rem]"
    : index === 1
      ? "genre-tile lg:col-span-5 min-h-[8.5rem] sm:min-h-[10.5rem]"
      : index === 2
        ? "genre-tile lg:col-span-5 min-h-[8.5rem] sm:min-h-[10.5rem]"
        : "genre-tile lg:col-span-4 min-h-[7.5rem] sm:min-h-[9rem]";

  return (
    <Link
      id={`mood-${genre.slug}`}
      href={`/genres/${genre.slug}`}
      className={`group relative scroll-mt-28 overflow-hidden rounded-[1.2rem] sm:scroll-mt-32 ${layout}`}
      style={
        {
          animationDelay: `${index * 28}ms`,
          "--genre-tile-accent": accent.solid,
        } as CSSProperties
      }
    >
      <div className="absolute inset-0 bg-elevated" />
      {cover ? (
        <SafeImage
          src={cover.src}
          alt=""
          fill
          sizes={
            isHero
              ? "(max-width: 1024px) 100vw, 58vw"
              : "(max-width: 1024px) 50vw, 40vw"
          }
          priority={index < 2}
          className={`object-cover transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05] ${cover.position ?? "object-center"}`}
        />
      ) : null}

      <div
        className="absolute inset-0 transition duration-500"
        style={{
          background: `
            linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.32) 36%, rgba(0,0,0,0.78) 72%, rgba(0,0,0,0.95) 100%),
            linear-gradient(135deg, ${wash} 0%, transparent 54%),
            radial-gradient(ellipse 90% 50% at 50% 108%, ${accent.solid}30, transparent 68%)
          `,
        }}
      />

      <div
        aria-hidden
        className="mood-cloud pointer-events-none absolute -left-[14%] top-[6%] h-[4.5rem] w-[48%] rounded-full blur-3xl opacity-65 transition duration-500 group-hover:opacity-100"
        style={{ background: `${accent.solid}2a` }}
      />
      <div
        aria-hidden
        className="mood-cloud-slow pointer-events-none absolute -right-[10%] bottom-[8%] h-14 w-[42%] rounded-full blur-3xl opacity-45 transition duration-500 group-hover:opacity-75"
        style={{ background: `${accent.soft}22` }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(540px 280px at 18% 88%, ${accent.solid}48, transparent 70%)`,
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-55 transition duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent 4%, ${accent.soft}60 48%, transparent 96%)`,
        }}
      />

      <div
        className={`relative z-10 flex h-full flex-col justify-between p-4 sm:p-5 ${
          isHero ? "lg:p-6" : ""
        }`}
      >
        <div className="flex items-start justify-end">
          <span
            className="rounded-full border px-2 py-0.5 text-[0.65rem] tabular-nums tracking-[-0.01em] backdrop-blur-md"
            style={{
              color: accent.mist,
              borderColor: `${accent.solid}42`,
              background: `color-mix(in oklab, ${accent.solid} 16%, rgba(0,0,0,0.55))`,
            }}
          >
            {genre.count.toLocaleString()}
          </span>
        </div>

        <div>
          <p
            className="mb-1 flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em]"
            style={{ color: accent.soft }}
          >
            <span
              aria-hidden
              className="sakura-dot h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: accent.solid }}
            />
            {copy.eyebrow}
          </p>
          <h3
            className={`font-semibold tracking-[-0.045em] text-snow ${
              isHero
                ? "text-[clamp(1.85rem,3.8vw,2.75rem)]"
                : "text-[clamp(1.25rem,2.2vw,1.65rem)]"
            }`}
            style={{
              textShadow: `0 2px 28px color-mix(in oklab, ${accent.solid} 42%, transparent), 0 1px 3px rgba(0,0,0,0.65)`,
            }}
          >
            {genre.name}
          </h3>
          {isHero ? (
            <p className="mt-1.5 line-clamp-2 max-w-[22rem] text-[0.8125rem] leading-snug text-cloud/90">
              {copy.blurb}
            </p>
          ) : null}
          <p
            className="mt-2.5 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium transition duration-300 group-hover:brightness-110"
            style={{ color: accent.mist }}
          >
            <span>{copy.cta}</span>
            <span
              aria-hidden
              className="translate-x-0 transition duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
