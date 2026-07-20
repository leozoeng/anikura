import Image from "next/image";
import Link from "next/link";
import type { RelatedEntry, RelatedMediaCard } from "@/lib/related";

function displayTitle(title: {
  english?: string | null;
  romaji?: string | null;
}) {
  return title.english || title.romaji || "Untitled";
}

export function RelatedAnimeGrid({
  title,
  subtitle,
  items,
  badge,
  className = "mt-14",
}: {
  title: string;
  subtitle?: string;
  items: Array<RelatedMediaCard | RelatedEntry>;
  badge?: (item: RelatedMediaCard | RelatedEntry) => string | null | undefined;
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <section className={className}>
      <h2 className="section-title">{title}</h2>
      {subtitle ? <p className="section-sub">{subtitle}</p> : null}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => {
          const label = badge?.(item);
          const poster = item.media.coverImage?.large || item.match.poster;
          return (
            <Link
              key={`${item.match.id}-${item.media.id}`}
              href={`/anime/${item.match.id}/${item.match.slug}`}
              className="group"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-raised ring-1 ring-white/8 transition group-hover:ring-white/25">
                {poster ? (
                  <Image
                    src={poster}
                    alt={displayTitle(item.media.title)}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="180px"
                  />
                ) : null}
                {label ? (
                  <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-snow/95 backdrop-blur-sm">
                    {label}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 text-sm tracking-[-0.02em]">
                {displayTitle(item.media.title)}
              </p>
              {item.media.seasonYear ? (
                <p className="mt-0.5 text-xs text-mute">{item.media.seasonYear}</p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function RelatedAnimeList({
  title,
  items,
  badge,
}: {
  title: string;
  items: Array<RelatedMediaCard | RelatedEntry>;
  badge?: (item: RelatedMediaCard | RelatedEntry) => string | null | undefined;
}) {
  if (!items.length) return null;

  return (
    <div>
      <h3 className="text-base font-semibold tracking-[-0.02em] text-snow">
        {title}
      </h3>
      <ul className="mt-3 space-y-3">
        {items.map((item) => {
          const label = badge?.(item);
          const name = displayTitle(item.media.title);
          const poster = item.media.coverImage?.large || item.match.poster;
          return (
            <li key={`${title}-${item.match.id}-${item.media.id}`}>
              <Link
                href={`/anime/${item.match.id}/${item.match.slug}`}
                className="flex gap-3 rounded-xl p-1.5 transition hover:bg-white/[0.04]"
              >
                <span className="relative h-[72px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-raised">
                  <Image
                    src={poster}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="52px"
                  />
                </span>
                <span className="min-w-0 flex-1 py-1">
                  <span className="line-clamp-2 text-sm font-medium leading-snug tracking-[-0.02em] text-snow">
                    {name}
                  </span>
                  <span className="mt-1 block text-xs text-mute">
                    {label ||
                      item.media.format?.replaceAll("_", " ") ||
                      "Anime"}
                    {item.media.seasonYear ? ` · ${item.media.seasonYear}` : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
