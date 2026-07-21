import Image from "next/image";
import Link from "next/link";
import type { AniListMedia } from "@/lib/anilist";
import { displayTitle } from "@/lib/anilist";

type Props = {
  title: string;
  subtitle?: string;
  media: AniListMedia[];
  hrefForId: (aniListId: number) => string | null;
};

export function AniListRow({ title, subtitle, media, hrefForId }: Props) {
  const items = media
    .map((m) => ({ media: m, href: hrefForId(m.id) }))
    .filter((x) => x.href);

  if (!items.length) return null;

  return (
    <section className="space-y-5">
      <div className="px-3 sm:px-4">
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>

      <div className="fade-x scrollbar-none flex gap-4 overflow-x-auto px-3 pb-2 sm:gap-5 sm:px-4">
        {items.map(({ media: m, href }, i) => (
          <Link
            key={m.id}
            href={href!}
            className="poster-link group w-[138px] shrink-0 sm:w-[156px]"
            style={{ animationDelay: `${Math.min(i, 12) * 18}ms` }}
          >
            <div className="poster-frame relative aspect-[2/3] overflow-hidden rounded-[1.1rem] bg-raised">
              {(m.coverImage?.extraLarge || m.coverImage?.large) && (
                <Image
                  src={m.coverImage.extraLarge || m.coverImage.large || ""}
                  alt={displayTitle(m.title)}
                  fill
                  sizes="160px"
                  priority={i < 4}
                  className="poster-image object-cover"
                />
              )}
              <div className="poster-veil absolute inset-0" />
              {m.averageScore != null && (
                <span className="poster-score absolute left-2.5 top-2.5 z-[1]">
                  {(m.averageScore / 10).toFixed(1)}
                </span>
              )}
            </div>
            <div className="mt-3 space-y-0.5 px-0.5">
              <h3 className="line-clamp-2 text-[0.8125rem] font-medium leading-snug tracking-[-0.02em] transition duration-300 group-hover:text-sakura-mist">
                {displayTitle(m.title)}
              </h3>
              {m.averageScore != null && (
                <p className="text-[0.75rem] text-mute transition duration-300 group-hover:text-cloud">
                  {(m.averageScore / 10).toFixed(1)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
