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

/** Short shelf copy for mood teasers + detail heroes. */
export const MOOD_COPY: Record<
  string,
  { eyebrow: string; blurb: string; cta: string; hero: string }
> = {
  action: {
    eyebrow: "Pulse & steel",
    blurb: "Clash, chase, and keep moving — the shelf that never sits still.",
    cta: "Enter the fight",
    hero: "Blades out, engines hot — titles that hit hard and refuse to blink.",
  },
  fantasy: {
    eyebrow: "Otherworld nights",
    blurb: "Soft magic, long roads, and kingdoms that glow after dark.",
    cta: "Cross the threshold",
    hero: "Spellbound journeys and quiet wonders — wander until the map ends.",
  },
  comedy: {
    eyebrow: "Laugh out loud",
    blurb: "Chaos, timing, and the kind of warmth that sticks to your ribs.",
    cta: "Cue the laughs",
    hero: "From deadpan to disaster — the funniest corners of the catalog.",
  },
  adventure: {
    eyebrow: "Open road",
    blurb: "Maps, crews, and the next horizon always calling.",
    cta: "Start the voyage",
    hero: "Companions, quests, and the thrill of leaving home behind.",
  },
  drama: {
    eyebrow: "Soft ache",
    blurb: "Quiet rooms, heavy choices, and stories that linger past the credits.",
    cta: "Sit with it",
    hero: "Human hearts under night lights — beauty, weight, and release.",
  },
  romance: {
    eyebrow: "Heart weather",
    blurb: "Glances, almosts, and the sakura-soft pull toward someone else.",
    cta: "Fall in",
    hero: "First loves, slow burns, and the spark that rewrites a season.",
  },
  shounen: {
    eyebrow: "Rise together",
    blurb: "Rivalries, found family, and the climb that never quite ends.",
    cta: "Join the crew",
    hero: "Power-ups, bonds, and the next arc waiting on the horizon.",
  },
  supernatural: {
    eyebrow: "Beyond the veil",
    blurb: "Ghosts, omens, and nights that refuse to stay ordinary.",
    cta: "Step closer",
    hero: "What walks beside you when the streetlights flicker.",
  },
  "sci-fi": {
    eyebrow: "Neon futures",
    blurb: "Chrome skies, strange tech, and worlds rewritten by tomorrow.",
    cta: "Jack in",
    hero: "From soft starlight to hard steel — the future, remixed.",
  },
  "slice-of-life": {
    eyebrow: "Everyday glow",
    blurb: "Tea, trains, and tiny moments that somehow feel huge.",
    cta: "Slow down",
    hero: "Quiet days rendered with care — the beauty of simply being.",
  },
  school: {
    eyebrow: "Campus nights",
    blurb: "Clubs, corridors, and the version of yourself that starts here.",
    cta: "Open the gate",
    hero: "Bell rings, seasons turn — youth under fluorescent light.",
  },
  historical: {
    eyebrow: "Ink & era",
    blurb: "Past lives, long shadows, and stories written in dust and silk.",
    cta: "Turn the page",
    hero: "Empires, artisans, and the weight of what came before.",
  },
  mystery: {
    eyebrow: "Unsolved nights",
    blurb: "Clues in the dark and questions that refuse an easy answer.",
    cta: "Follow the trail",
    hero: "Whispers, locked rooms, and the truth waiting under glass.",
  },
  horror: {
    eyebrow: "Don't look away",
    blurb: "Dread done beautifully — shadows with teeth.",
    cta: "Enter carefully",
    hero: "Cold corridors and the kind of fear that stays polite until it isn't.",
  },
  isekai: {
    eyebrow: "Another life",
    blurb: "New worlds, second chances, and rules you learn the hard way.",
    cta: "Wake elsewhere",
    hero: "Portal nights and power fantasies — leave this world behind.",
  },
  mecha: {
    eyebrow: "Iron giants",
    blurb: "Cockpits, chrome, and the human heart inside the machine.",
    cta: "Launch",
    hero: "Metal titans and the pilots who refuse to let go.",
  },
  music: {
    eyebrow: "Stage lights",
    blurb: "Notes that crack open a night — bands, ballads, and bravado.",
    cta: "Hit play",
    hero: "Soundtracks for the soul — every performance a small rebellion.",
  },
  sports: {
    eyebrow: "Game on",
    blurb: "Sweat, rivalry, and the last second that changes everything.",
    cta: "Take the field",
    hero: "Training arcs and clutch moments — victory tastes better earned.",
  },
  psychological: {
    eyebrow: "Mind games",
    blurb: "Fractured POV, sharp edges, and puzzles made of people.",
    cta: "Go deeper",
    hero: "When the story turns inward — and the mirror stares back.",
  },
  magic: {
    eyebrow: "Spellcraft",
    blurb: "Sigils, academies, and power that costs something real.",
    cta: "Cast on",
    hero: "Witches, wizards, and the night the sky answers back.",
  },
  seinen: {
    eyebrow: "Grown edges",
    blurb: "Sharper stakes, slower burns — stories for the long night.",
    cta: "Stay up late",
    hero: "Adult themes under ink-black skies — no training wheels.",
  },
  shoujo: {
    eyebrow: "Ribbon nights",
    blurb: "Feelings first — glitter, guts, and glorious daydreams.",
    cta: "Open your heart",
    hero: "Romantic sparkle and soft courage — emotions worn on the sleeve.",
  },
  "super-power": {
    eyebrow: "Awakened",
    blurb: "Gifts that change the rules — and the price that follows.",
    cta: "Unleash",
    hero: "Abilities, awakenings, and the fight to stay human.",
  },
  "martial-arts": {
    eyebrow: "Fist & form",
    blurb: "Discipline, duels, and the poetry of a perfect strike.",
    cta: "Step onto the mat",
    hero: "Dojo nights and rival schools — strength as language.",
  },
  military: {
    eyebrow: "Front lines",
    blurb: "Orders, loyalty, and the cost of holding the line.",
    cta: "Report in",
    hero: "Strategy under fire — courage with a chain of command.",
  },
  kids: {
    eyebrow: "Bright mornings",
    blurb: "Warm, wild, and wonderful — stories made for wonder.",
    cta: "Come play",
    hero: "Gentle adventures and big feelings sized for every age.",
  },
  space: {
    eyebrow: "Starward",
    blurb: "Void, vessels, and the blue marble getting smaller behind you.",
    cta: "Leave orbit",
    hero: "Cosmic loneliness and crew bonds among the stars.",
  },
  thriller: {
    eyebrow: "Hold breath",
    blurb: "Tension wound tight — every cut a heartbeat louder.",
    cta: "Lean in",
    hero: "Cat-and-mouse nights where one wrong step rewrites everything.",
  },
  samurai: {
    eyebrow: "Blade & honor",
    blurb: "Steel, duty, and cherry blossoms that fall too soon.",
    cta: "Draw steel",
    hero: "Bushido under moonlight — elegance with an edge.",
  },
  police: {
    eyebrow: "Case file",
    blurb: "Badges, back alleys, and justice that never clocks out.",
    cta: "Open the case",
    hero: "Night shifts and neon precincts — protect and pursue.",
  },
  vampire: {
    eyebrow: "After dark",
    blurb: "Fangs, hunger, and romance with a midnight price.",
    cta: "Stay for nightfall",
    hero: "Immortal longing under crimson moonlight.",
  },
  demons: {
    eyebrow: "Hellbound",
    blurb: "Fiends, hunters, and the thin line between both.",
    cta: "Face the dark",
    hero: "Infernal deals and blades forged for things without names.",
  },
  demonia: {
    eyebrow: "Hellbound",
    blurb: "Fiends, hunters, and the thin line between both.",
    cta: "Face the dark",
    hero: "Infernal deals and blades forged for things without names.",
  },
  game: {
    eyebrow: "Level up",
    blurb: "High scores, deadly lobbies, and rules rewritten mid-match.",
    cta: "Press start",
    hero: "Play to survive — every round a new life.",
  },
  parody: {
    eyebrow: "Wink & nod",
    blurb: "Tropes flipped, roasted, and somehow still loved.",
    cta: "Get the joke",
    hero: "Anime laughing at itself — affectionately, of course.",
  },
  josei: {
    eyebrow: "Grown soft",
    blurb: "Adult hearts, complicated love, and nights that feel honest.",
    cta: "Read between",
    hero: "Romance and realism for hearts that have lived a little.",
  },
  harem: {
    eyebrow: "Crowded hearts",
    blurb: "Chemistry overload — charm, chaos, and too many almosts.",
    cta: "Pick a favorite",
    hero: "One protagonist, many sparks — comedy with a blush.",
  },
  ecchi: {
    eyebrow: "Cheeky heat",
    blurb: "Flirty chaos and knowing winks — keep it playful.",
    cta: "Peek in",
    hero: "Suggestive fun under soft lighting — nothing too serious.",
  },
};

const DEFAULT_MOOD_COPY = {
  eyebrow: "Mood shelf",
  blurb: "A curated corner of the night catalog — pick a title and disappear.",
  cta: "Enter the shelf",
  hero: "Titles tuned to this mood — browse, filter, and fall in.",
};

export function moodCopy(slug: string) {
  return MOOD_COPY[slug] ?? DEFAULT_MOOD_COPY;
}

/** Cinematic veil for mood teasers/heroes from the genre wash tint. */
export function moodVeil(slug: string) {
  const wash = genreWash(slug);
  return `
    linear-gradient(115deg, rgba(8,10,14,0.96) 0%, rgba(10,12,18,0.88) 38%, rgba(8,10,14,0.58) 100%),
    radial-gradient(520px 260px at 85% 35%, ${wash}, transparent 62%),
    radial-gradient(420px 220px at 12% 80%, rgba(255,140,170,0.1), transparent 60%)
  `;
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

export type MoodPreviewPoster = {
  id: number;
  slug: string;
  title: string;
  year: number;
  poster: string;
  score: number;
};

/** Top-scored posters per mood for Netflix-style teaser strips. */
export function pickGenrePreviews(
  catalog: CatalogAnime[],
  genres: GenreStat[],
  limit = 8,
): Map<string, MoodPreviewPoster[]> {
  const wanted = new Set(genres.map((g) => g.slug));
  const buckets = new Map<string, MoodPreviewPoster[]>();

  for (const anime of catalog) {
    if (!anime.poster) continue;
    const score = Number(anime.score) || 0;
    const year = anime.year || 0;
    const entry: MoodPreviewPoster = {
      id: anime.id,
      slug: anime.slug,
      title: anime.title,
      year,
      poster: anime.poster,
      score,
    };

    for (const name of anime.genres) {
      const slug = slugifyGenre(name);
      if (!wanted.has(slug)) continue;
      const list = buckets.get(slug) ?? [];
      list.push(entry);
      buckets.set(slug, list);
    }
  }

  const out = new Map<string, MoodPreviewPoster[]>();
  for (const genre of genres) {
    const list = buckets.get(genre.slug) ?? [];
    const seen = new Set<number>();
    const unique = list.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    unique.sort(
      (a, b) =>
        b.score - a.score || b.year - a.year || a.title.localeCompare(b.title),
    );
    out.set(genre.slug, unique.slice(0, limit));
  }
  return out;
}
