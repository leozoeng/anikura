import { NovelReader } from "@/components/novels/novel-reader";
import {
  getNovelChapterContent,
  getNovelChapters,
  getNovelDetail,
} from "@/lib/novelbuddy";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; chapterId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, chapterId } = await params;
  try {
    const [novel, chapters] = await Promise.all([
      getNovelDetail(id),
      getNovelChapters(id),
    ]);
    const chapter = chapters.find((c) => c.id === chapterId);
    return {
      title: chapter
        ? `${novel.title} — ${chapter.title}`
        : novel.title,
    };
  } catch {
    return { title: "Read" };
  }
}

export default async function NovelReadPage({ params }: Props) {
  const { id, chapterId } = await params;
  if (!id || !chapterId) notFound();

  let novel;
  let chapters;
  let content;
  try {
    [novel, chapters, content] = await Promise.all([
      getNovelDetail(id),
      getNovelChapters(id),
      getNovelChapterContent(id, chapterId),
    ]);
  } catch {
    notFound();
  }

  if (novel.isAdult) notFound();

  const index = chapters.findIndex((c) => c.id === chapterId);
  const chapter =
    index >= 0
      ? chapters[index]!
      : {
          id: chapterId,
          title: content.title,
          slug: "",
          number: content.number,
          updatedAt: null,
          views: null,
        };

  const prevChapter = index > 0 ? chapters[index - 1]! : null;
  const nextChapter =
    index >= 0 && index < chapters.length - 1 ? chapters[index + 1]! : null;

  return (
    <NovelReader
      novelId={novel.id}
      novelTitle={novel.title}
      chapter={chapter}
      html={content.html}
      wordCount={content.wordCount}
      readingMinutes={content.readingMinutes}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
    />
  );
}
