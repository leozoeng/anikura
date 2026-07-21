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
      ? "genre-tile sm:col-span-2 lg:col-span-7 lg:row-span-2 min-h-[14rem] sm:min-h-[22rem] lg:min-h-[28rem]"
      : index === 1
        ? "genre-tile lg:col-span-5 min-h-[10rem] sm:min-h-[13rem]"
        : index === 2
          ? "genre-tile lg:col-span-5 min-h-[10rem] sm:min-h-[13rem]"
          : "genre-tile lg:col-span-4 min-h-[9rem] sm:min-h-[11rem]";

  return (
    <Link
      href={`/genres/${genre.slug}`}
      className={`group relative overflow-hidden rounded-[1.35rem] ${layout}`}
      style={{
        animationDelay: `${index * 40}ms`,
        boxShadow: `0 0 0 1px color-mix(in oklab, ${accent.solid} 22%, transparent)`,
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
          className={`object-cover transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] ${cover.position ?? "object-center"}`}
        />
      ) : null}

      <div
        className="absolute inset-0 transition duration-300"
        style={{
          background: `
            linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.92) 100%),
            linear-gradient(135deg, ${wash} 0%, transparent 55%)
          `,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px 280px at 20% 80%, ${accent.solid}55, transparent 70%)`,
        }}
      />

      <div
        className={`relative z-10 flex h-full flex-col justify-between p-5 sm:p-6 ${
          index === 0 ? "lg:p-8" : ""
        }`}
      >
        <div className="flex items-start justify-end gap-3">
          <span
            className="rounded-full bg-black/40 px-2.5 py-1 text-[0.7rem] tracking-[-0.01em] backdrop-blur-md"
            style={{ color: accent.mist }}
          >
            {genre.count.toLocaleString()} titles
          </span>
        </div>

        <div>
          <p
            className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em]"
            style={{ color: accent.soft }}
          >
            Featured mood
          </p>
          <h3
            className={`font-semibold tracking-[-0.045em] text-snow transition duration-300 ${
              index === 0
                ? "text-[clamp(2.2rem,4.5vw,3.4rem)]"
                : "text-[clamp(1.45rem,2.5vw,1.9rem)]"
            }`}
            style={{ textShadow: `0 0 40px ${accent.solid}40` }}
          >
            {genre.name}
          </h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-cloud">
            <span>Enter the shelf</span>
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
