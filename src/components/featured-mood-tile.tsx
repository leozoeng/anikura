import Image from "next/image";
import Link from "next/link";
import { genreWash, moodAccent } from "@/lib/genre-moods";
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

  const layout =
    index === 0
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
      style={{
        animationDelay: `${index * 28}ms`,
        boxShadow: `
          0 0 0 1px color-mix(in oklab, ${accent.solid} 28%, transparent),
          0 12px 32px rgba(0,0,0,0.35)
        `,
      }}
    >
      <div className="absolute inset-0 bg-elevated" />
      {cover ? (
        <Image
          src={cover.src}
          alt=""
          fill
          sizes={
            index === 0
              ? "(max-width: 1024px) 100vw, 58vw"
              : "(max-width: 1024px) 50vw, 40vw"
          }
          priority={index < 2}
          className={`object-cover transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035] ${cover.position ?? "object-center"}`}
        />
      ) : null}

      <div
        className="absolute inset-0 transition duration-300"
        style={{
          background: `
            linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.48) 48%, rgba(0,0,0,0.9) 100%),
            linear-gradient(135deg, ${wash} 0%, transparent 55%)
          `,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(520px 240px at 18% 82%, ${accent.solid}50, transparent 70%)`,
        }}
      />

      <div
        className={`relative z-10 flex h-full flex-col justify-between p-4 sm:p-5 ${
          index === 0 ? "lg:p-6" : ""
        }`}
      >
        <div className="flex items-start justify-end">
          <span
            className="rounded-full bg-black/45 px-2 py-0.5 text-[0.65rem] tabular-nums tracking-[-0.01em] backdrop-blur-md"
            style={{ color: accent.mist }}
          >
            {genre.count.toLocaleString()}
          </span>
        </div>

        <div>
          <p
            className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em]"
            style={{ color: accent.soft }}
          >
            Featured
          </p>
          <h3
            className={`font-semibold tracking-[-0.045em] text-snow ${
              index === 0
                ? "text-[clamp(1.85rem,3.8vw,2.75rem)]"
                : "text-[clamp(1.25rem,2.2vw,1.65rem)]"
            }`}
          >
            {genre.name}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-cloud">
            <span>Enter</span>
            <span
              className="translate-x-0 transition duration-300 group-hover:translate-x-1"
              style={{ color: accent.soft }}
            >
              →
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
