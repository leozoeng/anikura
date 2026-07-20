import { slugifyGenre } from "@/lib/anikoto";
import type { CatalogAnime, GenreStat } from "@/lib/types";

/** Soft night washes — sakura / ink / steel, never purple or cream. */
export const GENRE_WASH: Record<string, string> = {
  action: "rgba(255, 92, 110, 0.28)",
  fantasy: "rgba(255, 179, 199, 0.22)",
  comedy: "rgba(255, 214, 170, 0.2)",
  adventure: "rgba(255, 160, 122, 0.22)",
  drama: "rgba(200, 180, 190, 0.18)",
  romance: "rgba(255, 140, 170, 0.32)",
  shounen: "rgba(255, 120, 140, 0.2)",
  supernatural: "rgba(180, 190, 210, 0.16)",
  "sci-fi": "rgba(160, 190, 210, 0.18)",
  "slice-of-life": "rgba(255, 200, 180, 0.16)",
  school: "rgba(255, 190, 160, 0.16)",
  historical: "rgba(210, 170, 140, 0.18)",
  mystery: "rgba(140, 150, 170, 0.2)",
  horror: "rgba(120, 90, 100, 0.28)",
  isekai: "rgba(255, 150, 180, 0.2)",
  mecha: "rgba(150, 165, 185, 0.2)",
  music: "rgba(255, 170, 200, 0.2)",
  sports: "rgba(255, 140, 100, 0.2)",
  psychological: "rgba(130, 120, 140, 0.22)",
};

export function genreWash(slug: string) {
  return GENRE_WASH[slug] ?? "rgba(255, 140, 170, 0.14)";
}

/** Short JP mood labels for featured tiles. */
export const GENRE_JP: Record<string, string> = {
  action: "アクション",
  fantasy: "ファンタジー",
  comedy: "コメディ",
  adventure: "冒険",
  drama: "ドラマ",
  romance: "恋愛",
  shounen: "少年",
  supernatural: "超自然",
  "sci-fi": "SF",
  "slice-of-life": "日常",
  school: "学園",
  historical: "時代劇",
  mystery: "ミステリー",
  horror: "ホラー",
  isekai: "異世界",
  mecha: "メカ",
  music: "音楽",
  sports: "スポーツ",
  psychological: "心理",
  seinen: "青年",
  shoujo: "少女",
};

export function genreJp(slug: string) {
  return GENRE_JP[slug] ?? null;
}

export function pickGenreCovers(
  catalog: CatalogAnime[],
  genres: GenreStat[],
): Map<string, CatalogAnime> {
  const wanted = new Set(genres.map((g) => g.slug));
  const best = new Map<string, { anime: CatalogAnime; score: number }>();

  for (const anime of catalog) {
    if (!anime.poster) continue;
    const score = Number(anime.score) || 0;
    for (const name of anime.genres) {
      const slug = slugifyGenre(name);
      if (!wanted.has(slug)) continue;
      const prev = best.get(slug);
      if (!prev || score > prev.score) {
        best.set(slug, { anime, score });
      }
    }
  }

  const out = new Map<string, CatalogAnime>();
  for (const [slug, entry] of best) {
    out.set(slug, entry.anime);
  }
  return out;
}

export function visibleGenres(genres: GenreStat[]) {
  return genres.filter((g) => g.slug !== "unknown" && g.count > 0);
}
