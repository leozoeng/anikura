import Image from "next/image";
import Link from "next/link";
import type { AniListMedia } from "@/lib/anilist";
import { displayTitle } from "@/lib/anilist";
import { formatPosterMeta, formatPosterScore } from "@/lib/poster-meta";

type Props = {
  title: string;
  subtitle?: string;
  media: AniListMedia[];
  hrefForId: (aniListId: number) => string | null;
  /** How many leading posters to preload (default none — rows are below the fold). */
  priorityCount?: number;
};

export function AniListRow({
  title,
  subtitle,
  media,
  hrefForId,
  priorityCount = 0,
}: Props) {
  const items = media
    .map((m) => ({ media: m, href: hrefForId(m.id) }))
    .filter((x) => x.href);

  if (!items.length) return null;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>

      <div className="fade-x scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-5">
        {items.map(({ media: m, href }, i) => {
          const score = formatPosterScore(m.averageScore);
          const meta = formatPosterMeta({
            type: m.format,
            year: m.seasonYear,
            score: m.averageScore,
          });
          return (
            <Link
              key={m.id}
              href={href!}
              className="poster-link pressable group w-[118px] shrink-0 snap-start sm:w-[156px]"
              style={{ animationDelay: `${Math.min(i, 12) * 18}ms` }}
            >
              <div className="poster-frame relative aspect-[2/3] overflow-hidden rounded-[1.1rem] bg-raised">
                {(m.coverImage?.large || m.coverImage?.extraLarge) && (
                  <Image
                    src={m.coverImage.large || m.coverImage.extraLarge || ""}
                    alt={displayTitle(m.title)}
                    fill
                    sizes="160px"
                    priority={i < priorityCount}
                    className="poster-image object-cover"
                    loading={i < priorityCount ? "eager" : "lazy"}
                  />
                )}
                <div className="poster-veil absolute inset-0" />
                {score ? (
                  <span className="poster-score absolute left-2.5 top-2.5 z-[1]">
                    {score}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 space-y-0.5 px-0.5">
                <h3 className="line-clamp-2 text-[0.8125rem] font-medium leading-snug tracking-[-0.02em] transition duration-300 group-hover:text-sakura-mist">
                  {displayTitle(m.title)}
                </h3>
                {meta ? (
                  <p className="text-[0.75rem] text-mute transition duration-300 group-hover:text-cloud">
                    {meta}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
