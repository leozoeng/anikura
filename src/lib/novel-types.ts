export type NovelListItem = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  status: string | null;
  rating: number | null;
  views: number | null;
  chaptersCount: number | null;
  summary: string | null;
  isAdult: boolean;
  isMtl: boolean;
  isHot: boolean;
  /** japanese | korean | chinese when known */
  origin: string | null;
  genres: string[];
  updatedAt: string | null;
};

export type NovelGenre = {
  id: string;
  name: string;
  slug: string;
};

export type NovelAuthor = {
  name: string;
  slug?: string;
};

export type NovelChapter = {
  id: string;
  title: string;
  slug: string;
  number: number | null;
  updatedAt: string | null;
  views: number | null;
};

export type NovelDetail = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  status: string | null;
  rating: number | null;
  views: number | null;
  chaptersCount: number | null;
  summary: string | null;
  isAdult: boolean;
  authors: NovelAuthor[];
  genres: NovelGenre[];
  tags: string[];
  firstChapter: NovelChapter | null;
  latestChapters: NovelChapter[];
  previewChapters: NovelChapter[];
  updatedAt: string | null;
};

export type NovelChapterContent = {
  id: string;
  title: string;
  number: number | null;
  html: string;
  wordCount: number | null;
  readingMinutes: number | null;
};
