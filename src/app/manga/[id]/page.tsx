import { MangaChapterList } from "@/components/manga/manga-chapter-list";
import { MangaDetailHero } from "@/components/manga/manga-detail-hero";
import { MangaPoster } from "@/components/manga/manga-poster";
import { SectionHeading } from "@/components/section-heading";
import {
  getAllMangaChapters,
  getMangaDetail,
  getTrendingManga,
} from "@/lib/atsu";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 120;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const manga = await getMangaDetail(id);
    return {
      title: manga.title,
      description:
        manga.synopsis?.slice(0, 160) ||
        `Read ${manga.title} on Anikura.`,
    };
  } catch {
    return { title: "Manga" };
  }
}

export default async function MangaDetailPage({ params }: Props) {
  const { id } = await params;
  if (!id) notFound();

  let manga;
  let chapters;
  try {
    [manga, chapters] = await Promise.all([
      getMangaDetail(id),
      getAllMangaChapters(id),
    ]);
  } catch {
    notFound();
  }

  if (manga.isAdult) notFound();

  const firstChapter = chapters[0] ?? null;
  const latestChapter = chapters[chapters.length - 1] ?? null;

  let related = [] as Awaited<ReturnType<typeof getTrendingManga>>;
  try {
    related = (await getTrendingManga(0))
      .filter((item) => item.id !== manga.id)
      .slice(0, 12);
  } catch {
    related = [];
  }

  return (
    <div className="page-enter pb-16">
      <MangaDetailHero
        manga={manga}
        firstChapter={firstChapter}
        latestChapter={latestChapter}
      />

      <div className="page-shell">
        <MangaChapterList mangaId={manga.id} chapters={chapters} />

        {related.length ? (
          <section className="mt-16">
            <SectionHeading
              eyebrow="More to read"
              title="Also on the shelf"
              subtitle="Nearby titles warming the same night"
            />
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {related.map((item, i) => (
                <MangaPoster key={item.id} manga={item} index={i} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
