import type { CatalogAnime } from "@/lib/types";

/**
 * Iconic One Piece shelf — main series + major films (not every special/recap).
 */
export type OnePieceEntryDef = {
  id?: number;
  match: RegExp;
  year: number;
  title: string;
  /** Main TV series */
  series?: boolean;
  film?: boolean;
};

export const ONE_PIECE_ENTRIES: OnePieceEntryDef[] = [
  {
    id: 1642,
    title: "One Piece",
    year: 1999,
    series: true,
    match: /^one piece$/i,
  },
  {
    id: 2405,
    title: "One Piece Movie 1",
    year: 2000,
    film: true,
    match: /one piece movie 1(?!\d)|one piece: the movie$/i,
  },
  {
    id: 2419,
    title: "Clockwork Island Adventure",
    year: 2001,
    film: true,
    match: /clockwork island/i,
  },
  {
    id: 2827,
    title: "Chopper Kingdom of Strange Animal Island",
    year: 2002,
    film: true,
    match: /chopper kingdom/i,
  },
  {
    id: 262,
    title: "Dead End Adventure",
    year: 2003,
    film: true,
    match: /dead end/i,
  },
  {
    id: 2022,
    title: "The Curse of the Sacred Sword",
    year: 2004,
    film: true,
    match: /curse of the sacred sword/i,
  },
  {
    id: 733,
    title: "Baron Omatsuri and the Secret Island",
    year: 2005,
    film: true,
    match: /baron omatsuri/i,
  },
  {
    id: 333,
    title: "Adventures in Alabasta",
    year: 2007,
    film: true,
    match: /adventures in alabasta|movie 8/i,
  },
  {
    id: 1363,
    title: "Strong World",
    year: 2009,
    film: true,
    match: /strong world(?! episode)/i,
  },
  {
    id: 1362,
    title: "Film Z",
    year: 2012,
    film: true,
    match: /film z|movie 12/i,
  },
  {
    id: 1088,
    title: "Film Gold",
    year: 2016,
    film: true,
    match: /film:? ?gold|movie 13/i,
  },
  {
    id: 6519,
    title: "Film Red",
    year: 2022,
    film: true,
    match: /film:? ?red/i,
  },
  {
    id: 7314,
    title: "One Piece Fan Letter",
    year: 2024,
    match: /fan letter/i,
  },
];

export type OnePieceCatalogEntry = {
  def: OnePieceEntryDef;
  anime: CatalogAnime;
};

function blob(anime: CatalogAnime) {
  return [anime.title, anime.alternative, anime.native, anime.titles]
    .filter(Boolean)
    .join(" · ");
}

export function getOnePieceCollection(
  catalog: CatalogAnime[],
): OnePieceCatalogEntry[] {
  const byId = new Map(catalog.map((a) => [a.id, a]));
  const used = new Set<number>();
  const out: OnePieceCatalogEntry[] = [];

  for (const def of ONE_PIECE_ENTRIES) {
    let anime: CatalogAnime | undefined;
    if (def.id != null) anime = byId.get(def.id);
    if (!anime) {
      anime = catalog.find((a) => {
        if (used.has(a.id)) return false;
        return def.match.test(blob(a));
      });
    }
    // Prefer exact main series title when matching "One Piece"
    if (anime && def.series) {
      const exact = byId.get(1642) ?? catalog.find((a) => /^one piece$/i.test(a.title.trim()));
      if (exact) anime = exact;
    }
    if (!anime || used.has(anime.id)) continue;
    used.add(anime.id);
    out.push({ def, anime });
  }

  return out;
}

export function onePieceFilmCount(entries: OnePieceCatalogEntry[]) {
  return entries.filter((e) => e.def.film).length;
}
