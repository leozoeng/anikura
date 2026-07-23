import { SafeImage } from "@/components/safe-image";
import { formatMangaRating, mangaHref } from "@/lib/atsu";
import type { MangaListItem } from "@/lib/manga-types";
import Link from "next/link";

type Props = {
  manga: MangaListItem;
  priority?: boolean;
  className?: string;
  index?: number;
};

export function MangaPoster({
  manga,
  priority,
  className = "",
  index,
}: Props) {
  const score = formatMangaRating(manga.rating);
  const delay =
    typeof index === "number"
      ? { animationDelay: `${Math.min(index, 14) * 18}ms` }
      : undefined;

  return (
    <Link
      href={mangaHref(manga.id)}
      className={`poster-link pressable group relative block ${className}`}
      style={delay}
    >
      <div className="poster-frame relative aspect-[2/3] overflow-hidden rounded-[1.1rem] bg-raised">
        {manga.poster ? (
          <SafeImage
            src={manga.poster}
            alt={manga.title}
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
      </div>

      <div className="mt-3 space-y-0.5 px-0.5">
        <h3 className="line-clamp-2 text-[0.8125rem] font-medium leading-snug tracking-[-0.02em] transition duration-300 group-hover:text-sakura-mist">
          {manga.title}
        </h3>
        {manga.views ? (
          <p className="text-[0.75rem] text-mute transition duration-300 group-hover:text-cloud">
            {manga.views} views
          </p>
        ) : null}
      </div>
    </Link>
  );
}
