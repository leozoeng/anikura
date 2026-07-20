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
      <div className="mx-auto flex max-w-[1200px] items-end justify-between gap-4 px-5 sm:px-8">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-sub">{subtitle}</p>}
        </div>
        <span className="text-[11px] uppercase tracking-[0.16em] text-mute">
          AniList
        </span>
      </div>

      <div className="fade-x scrollbar-none flex gap-4 overflow-x-auto px-5 pb-2 sm:gap-5 sm:px-8">
        {items.map(({ media: m, href }, i) => (
          <Link
            key={m.id}
            href={href!}
            className="group w-[138px] shrink-0 sm:w-[156px]"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-[1.1rem] bg-raised ring-1 ring-white/8 transition duration-500 group-hover:-translate-y-1 group-hover:ring-white/25">
              {(m.coverImage?.extraLarge || m.coverImage?.large) && (
                <Image
                  src={m.coverImage.extraLarge || m.coverImage.large || ""}
                  alt={displayTitle(m.title)}
                  fill
                  sizes="160px"
                  priority={i < 4}
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>
            <div className="mt-3 space-y-0.5 px-0.5">
              <h3 className="line-clamp-2 text-[0.8125rem] font-medium leading-snug tracking-[-0.02em]">
                {displayTitle(m.title)}
              </h3>
              {m.averageScore != null && (
                <p className="text-[0.75rem] text-mute">
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
