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
  magic: "rgba(190, 160, 210, 0.16)",
  seinen: "rgba(160, 150, 140, 0.2)",
  shoujo: "rgba(255, 160, 190, 0.22)",
  ecchi: "rgba(255, 130, 150, 0.18)",
  "super-power": "rgba(255, 150, 110, 0.2)",
  "martial-arts": "rgba(220, 140, 100, 0.2)",
  military: "rgba(140, 155, 140, 0.2)",
  harem: "rgba(255, 150, 170, 0.18)",
  kids: "rgba(255, 200, 140, 0.18)",
  space: "rgba(120, 140, 190, 0.22)",
  thriller: "rgba(130, 110, 130, 0.24)",
  samurai: "rgba(190, 140, 110, 0.2)",
  police: "rgba(140, 160, 180, 0.18)",
  vampire: "rgba(150, 100, 120, 0.24)",
  demonia: "rgba(160, 110, 130, 0.2)",
  demons: "rgba(160, 110, 130, 0.2)",
  game: "rgba(140, 180, 160, 0.18)",
  parody: "rgba(255, 190, 140, 0.18)",
  josei: "rgba(200, 160, 180, 0.18)",
};

export function genreWash(slug: string) {
  return GENRE_WASH[slug] ?? "rgba(255, 140, 170, 0.14)";
}

/**
 * Curated cinematic stills (~1920×1080), hosted locally.
 * Distinct iconic art per mood — not score-ranked catalog posters.
 * Prefer sharp 16:9 compositions that crop cleanly on square dark tiles.
 * Admin overrides (Supabase `mood_art`) take precedence at runtime.
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
    position: "object-[center_72%]",
  },
  comedy: {
    src: "/moods/comedy.jpg",
    credit: "Bocchi the Rock!",
    position: "object-[68%_center]",
  },
  adventure: {
    src: "/moods/adventure.jpg",
    credit: "Fullmetal Alchemist: Brotherhood",
    position: "object-[center_38%]",
  },
  drama: {
    src: "/moods/drama.jpg",
    credit: "Your Lie in April",
    position: "object-center",
  },
  romance: {
    src: "/moods/romance.jpg",
    credit: "Your Name.",
    position: "object-[center_58%]",
  },
  "sci-fi": {
    src: "/moods/scifi.jpg",
    credit: "Cyberpunk: Edgerunners",
    position: "object-[center_68%]",
  },
  shounen: {
    src: "/moods/shounen.jpg",
    credit: "Demon Slayer: Kimetsu no Yaiba",
    position: "object-[42%_center]",
  },
};

export type MoodArtResolved = {
  src: string;
  credit: string;
  position?: string;
  /** True when src comes from an admin override. */
  overridden?: boolean;
};

export type MoodArtOverrides = Map<string, string> | Record<string, string>;

function overrideUrl(
  slug: string,
  overrides?: MoodArtOverrides | null,
): string | null {
  if (!overrides) return null;
  if (overrides instanceof Map) return overrides.get(slug) ?? null;
  return overrides[slug] ?? null;
}

/** Prefer admin override URL; fall back to bundled MOOD_ART. */
export function moodArt(
  slug: string,
  overrides?: MoodArtOverrides | null,
): MoodArtResolved | null {
  const custom = overrideUrl(slug, overrides);
  const base = MOOD_ART[slug];
  if (custom) {
    return {
      src: custom,
      credit: base?.credit ?? "",
      position: base?.position ?? "object-center",
      overridden: true,
    };
  }
  return base ? { ...base, overridden: false } : null;
}

/** Moods shown in the admin art desk (curated + wash palette). */
export function adminMoodSlugs(): string[] {
  const set = new Set([...Object.keys(MOOD_ART), ...Object.keys(GENRE_WASH)]);
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function moodLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Prefer curated / overridden mood art; fall back to unique high-score banners. */
export function pickGenreCovers(
  catalog: CatalogAnime[],
  genres: GenreStat[],
  overrides?: MoodArtOverrides | null,
): Map<string, { src: string; position?: string }> {
  const out = new Map<string, { src: string; position?: string }>();
  const used = new Set<string>();

  for (const genre of genres) {
    const curated = moodArt(genre.slug, overrides);
    if (curated) {
      out.set(genre.slug, { src: curated.src, position: curated.position });
      used.add(curated.src);
    }
  }

  const remaining = genres.filter((g) => !out.has(g.slug));
  if (!remaining.length) return out;

  assignBestCovers(catalog, remaining, out, used, { unique: true });

  const stillMissing = genres.filter((g) => !out.has(g.slug));
  if (stillMissing.length) {
    // Second pass: fill gaps even if art was already used elsewhere.
    assignBestCovers(catalog, stillMissing, out, used, { unique: false });
  }

  return out;
}

function assignBestCovers(
  catalog: CatalogAnime[],
  genres: GenreStat[],
  out: Map<string, { src: string; position?: string }>,
  used: Set<string>,
  opts: { unique: boolean },
) {
  const wanted = new Set(genres.map((g) => g.slug));
  const best = new Map<
    string,
    { src: string; score: number; hasBanner: boolean }
  >();

  for (const anime of catalog) {
    const banner = anime.background_image?.trim();
    const src = banner || anime.poster;
    if (!src) continue;
    if (opts.unique && used.has(src)) continue;
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
    if (opts.unique && used.has(entry.src)) continue;
    out.set(slug, { src: entry.src, position: "object-center" });
    used.add(entry.src);
  }
}

export function visibleGenres(genres: GenreStat[]) {
  return genres.filter((g) => g.slug !== "unknown" && g.count > 0);
}
