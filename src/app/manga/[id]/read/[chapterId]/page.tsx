import { MangaReader } from "@/components/manga/manga-reader";
import {
  getAllMangaChapters,
  getChapterPages,
  getMangaDetail,
} from "@/lib/atsu";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; chapterId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, chapterId } = await params;
  try {
    const [manga, chapters] = await Promise.all([
      getMangaDetail(id),
      getAllMangaChapters(id),
    ]);
    const chapter = chapters.find((c) => c.id === chapterId);
    return {
      title: chapter
        ? `${manga.title} — ${chapter.title || `Chapter ${chapter.number}`}`
        : manga.title,
    };
  } catch {
    return { title: "Read" };
  }
}

export default async function MangaReadPage({ params }: Props) {
  const { id, chapterId } = await params;
  if (!id || !chapterId) notFound();

  let manga;
  let chapters;
  let read;
  try {
    [manga, chapters, read] = await Promise.all([
      getMangaDetail(id),
      getAllMangaChapters(id),
      getChapterPages(id, chapterId),
    ]);
  } catch {
    notFound();
  }

  if (manga.isAdult) notFound();

  const index = chapters.findIndex((c) => c.id === chapterId);
  const chapter =
    index >= 0
      ? chapters[index]!
      : {
          id: chapterId,
          title: read.title,
          number: 0,
          index: 0,
          pageCount: read.pages.length,
          createdAt: null,
        };

  const prevChapter = index > 0 ? chapters[index - 1]! : null;
  const nextChapter =
    index >= 0 && index < chapters.length - 1 ? chapters[index + 1]! : null;

  return (
    <MangaReader
      mangaId={manga.id}
      mangaTitle={manga.title}
      chapter={chapter}
      pages={read.pages}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
    />
  );
}
