export type MangaType = "Manga" | "Manwha" | "Manhua" | "OEL" | string;

export type MangaListItem = {
  id: string;
  title: string;
  type: MangaType;
  isAdult: boolean;
  rating: number | null;
  views: string | null;
  poster: string | null;
  posterSmall: string | null;
};

export type MangaGenre = {
  id: string;
  name: string;
  weight?: string;
};

export type MangaAuthor = {
  id: string;
  name: string;
  slug?: string;
  type?: string;
};

export type MangaScanlator = {
  id: string;
  name: string;
};

export type MangaChapter = {
  id: string;
  title: string;
  number: number;
  index: number;
  pageCount: number;
  createdAt: string | null;
  scanlationMangaId?: string | null;
};

export type MangaPageImage = {
  id: string;
  src: string;
  number: number;
  width: number;
  height: number;
  aspectRatio: number;
};

export type MangaDetail = {
  id: string;
  title: string;
  englishTitle: string | null;
  otherNames: string[];
  type: MangaType;
  status: string | null;
  synopsis: string | null;
  isAdult: boolean;
  rating: number | null;
  views: string | null;
  released: number | null;
  totalChapterCount: number | null;
  poster: string | null;
  posterLarge: string | null;
  banner: string | null;
  genres: MangaGenre[];
  tags: string[];
  authors: MangaAuthor[];
  scanlators: MangaScanlator[];
  recentChapters: MangaChapter[];
};
