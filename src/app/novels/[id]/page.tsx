import { NovelChapterList } from "@/components/novels/novel-chapter-list";
import { NovelDetailHero } from "@/components/novels/novel-detail-hero";
import { NovelPoster } from "@/components/novels/novel-poster";
import { SectionHeading } from "@/components/section-heading";
import {
  getNovelChapters,
  getNovelDetail,
  getPopularNovels,
} from "@/lib/novelbuddy";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 120;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const novel = await getNovelDetail(id);
    return {
      title: novel.title,
      description:
        novel.summary?.slice(0, 160) || `Read ${novel.title} on Anikura.`,
    };
  } catch {
    return { title: "Novel" };
  }
}

export default async function NovelDetailPage({ params }: Props) {
  const { id } = await params;
  if (!id) notFound();

  let novel;
  let chapters;
  try {
    [novel, chapters] = await Promise.all([
      getNovelDetail(id),
      getNovelChapters(id),
    ]);
  } catch {
    notFound();
  }

  if (novel.isAdult) notFound();

  const firstChapter =
    novel.firstChapter ||
    chapters[0] ||
    novel.previewChapters[novel.previewChapters.length - 1] ||
    null;
  const latestChapter =
    chapters[chapters.length - 1] ||
    novel.latestChapters[0] ||
    novel.previewChapters[0] ||
    null;

  let related = [] as Awaited<ReturnType<typeof getPopularNovels>>;
  try {
    related = (await getPopularNovels(18)).filter((n) => n.id !== novel.id).slice(0, 12);
  } catch {
    related = [];
  }

  return (
    <div className="page-enter pb-16">
      <NovelDetailHero
        novel={novel}
        firstChapter={firstChapter}
        latestChapter={latestChapter}
      />

      <div className="page-shell">
        <NovelChapterList
          novelId={novel.id}
          chapters={chapters.length ? chapters : novel.previewChapters}
        />

        {related.length ? (
          <section className="mt-16">
            <SectionHeading
              eyebrow="More to read"
              title="Also on the shelf"
              subtitle="Nearby titles for the next quiet stretch"
            />
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {related.map((item, i) => (
                <NovelPoster key={item.id} novel={item} index={i} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
