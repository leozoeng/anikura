import { SafeImage } from "@/components/safe-image";
import {
  formatNovelRating,
  formatNovelViews,
  novelHref,
} from "@/lib/novelbuddy";
import type { NovelListItem } from "@/lib/novel-types";
import Link from "next/link";

type Props = {
  novel: NovelListItem;
  priority?: boolean;
  className?: string;
  index?: number;
};

export function NovelPoster({
  novel,
  priority,
  className = "",
  index,
}: Props) {
  const score = formatNovelRating(novel.rating);
  const views = formatNovelViews(novel.views);
  const delay =
    typeof index === "number"
      ? { animationDelay: `${Math.min(index, 14) * 18}ms` }
      : undefined;

  return (
    <Link
      href={novelHref(novel.id)}
      className={`poster-link group relative block ${className}`}
      style={delay}
    >
      <div className="poster-frame relative aspect-[2/3] overflow-hidden rounded-[1.1rem] bg-raised">
        {novel.cover ? (
          <SafeImage
            src={novel.cover}
            alt={novel.title}
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
      <div className="mt-2.5 px-0.5">
        <h3 className="line-clamp-2 text-[0.9rem] font-medium leading-snug tracking-[-0.02em] text-snow transition group-hover:text-sakura-soft">
          {novel.title}
        </h3>
        <p className="mt-1 text-[0.72rem] text-mute">
          {novel.chaptersCount
            ? `${novel.chaptersCount.toLocaleString()} ch`
            : novel.status || "Novel"}
          {views ? ` · ${views} views` : ""}
        </p>
      </div>
    </Link>
  );
}
