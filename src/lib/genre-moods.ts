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

/**
 * Curated AniList widescreen banners (~1900×400), hosted locally.
 * Distinct iconic art per mood — not score-ranked catalog posters.
 * Prefer sharp, genre-clear banners; tile overlays darken for sakura-night UI.
 */
export const MOOD_ART: Record<
  string,
  { src: string; credit: string; position?: string }
> = {
  action: {
    src: "/moods/action.jpg",
    credit: "One Piece",
    position: "object-[center_22%]",
  },
  fantasy: {
    src: "/moods/fantasy.jpg",
    credit: "Frieren: Beyond Journey's End",
    position: "object-[center_42%]",
  },
  comedy: {
    src: "/moods/comedy.jpg",
    credit: "Bocchi the Rock!",
    position: "object-[center_40%]",
  },
  adventure: {
    src: "/moods/adventure.jpg",
    credit: "ONE PIECE",
    position: "object-[center_35%]",
  },
  drama: {
    src: "/moods/drama.jpg",
    credit: "Your Lie in April",
    position: "object-[center_45%]",
  },
  romance: {
    src: "/moods/romance.jpg",
    credit: "Your Name.",
    position: "object-center",
  },
};

export function moodArt(slug: string) {
  return MOOD_ART[slug] ?? null;
}

/** Prefer curated mood art; fall back to unique high-score banners from catalog. */
export function pickGenreCovers(
  catalog: CatalogAnime[],
  genres: GenreStat[],
): Map<string, { src: string; position?: string }> {
  const out = new Map<string, { src: string; position?: string }>();
  const used = new Set<string>();

  for (const genre of genres) {
    const curated = MOOD_ART[genre.slug];
    if (curated) {
      out.set(genre.slug, { src: curated.src, position: curated.position });
      used.add(curated.src);
    }
  }

  const remaining = genres.filter((g) => !out.has(g.slug));
  if (!remaining.length) return out;

  const wanted = new Set(remaining.map((g) => g.slug));
  const best = new Map<
    string,
    { src: string; score: number; hasBanner: boolean }
  >();

  for (const anime of catalog) {
    const banner = anime.background_image?.trim();
    const src = banner || anime.poster;
    if (!src || used.has(src)) continue;
    const score = Number(anime.score) || 0;
    const hasBanner = Boolean(banner);

    for (const name of anime.genres) {
      const slug = slugifyGenre(name);
      if (!wanted.has(slug) || out.has(slug)) continue;
      const prev = best.get(slug);
      if (
        !prev ||
        (hasBanner && !prev.hasBanner) ||
        (hasBanner === prev.hasBanner && score > prev.score)
      ) {
        best.set(slug, { src, score, hasBanner });
      }
    }
  }

  for (const [slug, entry] of best) {
    if (used.has(entry.src)) continue;
    out.set(slug, { src: entry.src, position: "object-center" });
    used.add(entry.src);
  }

  return out;
}

export function visibleGenres(genres: GenreStat[]) {
  return genres.filter((g) => g.slug !== "unknown" && g.count > 0);
}
