import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import type { SeasonEntry } from "@/lib/related";

type Props = {
  seasons: SeasonEntry[];
  className?: string;
};

/**
 * Clear Season 1 / 2 / 3… strip for multi-season franchises.
 * Current season is highlighted; others link to their more-info pages.
 */
export function SeasonsSection({ seasons, className = "mt-16" }: Props) {
  if (seasons.length < 2) return null;

  return (
    <section className={className}>
      <SectionHeading
        title="Seasons"
        subtitle="Jump to any installment in this series."
      />

      <div className="scrollbar-none mt-6 flex gap-3 overflow-x-auto pb-2 sm:gap-4">
        {seasons.map((season) => {
          const title =
            season.media.title.english ||
            season.media.title.romaji ||
            season.match.title;
          const poster =
            season.media.coverImage?.large || season.match.poster;
          const label = `Season ${season.seasonIndex}`;
          const inner = (
            <>
              <div
                className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-raised ${
                  season.isCurrent
                    ? "ring-2 ring-[#ff8caa] shadow-[0_12px_36px_rgba(255,140,170,0.22)]"
                    : "ring-1 ring-white/10 transition group-hover:ring-[#ff8caa]/40"
                }`}
              >
                {poster ? (
                  <Image
                    src={poster}
                    alt={title}
                    fill
                    className={`object-cover transition duration-500 ${
                      season.isCurrent ? "" : "group-hover:scale-[1.04]"
                    }`}
                    sizes="160px"
                  />
                ) : null}
                <span
                  className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-[-0.01em] backdrop-blur-sm ${
                    season.isCurrent
                      ? "bg-[#ff8caa] text-black"
                      : "bg-black/75 text-snow"
                  }`}
                >
                  {label}
                </span>
                {season.isCurrent ? (
                  <span className="absolute inset-x-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ffb3c7] backdrop-blur-sm">
                    Current
                  </span>
                ) : null}
              </div>
              <p
                className={`mt-2.5 line-clamp-2 text-sm tracking-[-0.02em] ${
                  season.isCurrent ? "text-sakura-soft" : "text-snow"
                }`}
              >
                {title}
              </p>
              {season.media.seasonYear ? (
                <p className="mt-0.5 text-xs text-mute">
                  {season.media.seasonYear}
                </p>
              ) : null}
            </>
          );

          if (season.isCurrent) {
            return (
              <div
                key={season.match.id}
                className="w-[132px] shrink-0 sm:w-[148px]"
                aria-current="page"
              >
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={season.match.id}
              href={`/anime/${season.match.id}/${season.match.slug}`}
              className="group w-[132px] shrink-0 sm:w-[148px]"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
