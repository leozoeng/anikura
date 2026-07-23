import { NovelPoster } from "@/components/novels/novel-poster";
import { SectionHeading } from "@/components/section-heading";
import type { NovelListItem } from "@/lib/novel-types";
import Link from "next/link";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: NovelListItem[];
  seeAllHref?: string;
};

export function NovelRow({
  eyebrow,
  title,
  subtitle,
  items,
  seeAllHref,
}: Props) {
  if (!items.length) return null;

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="shrink-0 text-sm text-mute transition hover:text-sakura-soft"
          >
            See all
          </Link>
        ) : null}
      </div>
      <div className="fade-x -mx-1 overflow-x-auto px-1 scrollbar-none">
        <div className="flex w-max gap-3.5 pb-1 sm:gap-4">
          {items.map((novel, i) => (
            <NovelPoster
              key={novel.id}
              novel={novel}
              index={i}
              className="w-[9.5rem] shrink-0 sm:w-[11rem]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
