import type { CatalogAnime } from "@/lib/types";

/**
 * Makoto Shinkai feature films & major shorts — chronological.
 */
export type ShinkaiFilmDef = {
  id?: number;
  match: RegExp;
  year: number;
  title: string;
};

export const SHINKAI_FILMS: ShinkaiFilmDef[] = [
  {
    id: 1730,
    title: "Voices of a Distant Star",
    year: 2002,
    match: /voices of a distant star|hoshi no koe/i,
  },
  {
    id: 616,
    title: "The Place Promised in Our Early Days",
    year: 2004,
    match: /place promised in our early days|kumo no mukou/i,
  },
  {
    id: 845,
    title: "5 Centimeters Per Second",
    year: 2007,
    match: /5 centimeters per second|five centimeters|byousoku 5/i,
  },
  {
    id: 269,
    title: "Children Who Chase Lost Voices",
    year: 2011,
    match: /children who chase lost voices|hoshi wo ou kodomo/i,
  },
  {
    id: 1516,
    title: "The Garden of Words",
    year: 2013,
    match: /garden of words|kotonoha no niwa/i,
  },
  {
    id: 61,
    title: "Your Name",
    year: 2016,
    match: /^your name|kimi no na (wa|wa\.?)/i,
  },
  {
    id: 1632,
    title: "Weathering With You",
    year: 2019,
    match: /weathering with you|tenki no ko/i,
  },
  {
    id: 7201,
    title: "Suzume",
    year: 2022,
    match: /suzume/i,
  },
];

export type ShinkaiCatalogEntry = {
  def: ShinkaiFilmDef;
  anime: CatalogAnime;
};

function blob(anime: CatalogAnime) {
  return [anime.title, anime.alternative, anime.native, anime.titles]
    .filter(Boolean)
    .join(" · ");
}

export function getShinkaiCollection(
  catalog: CatalogAnime[],
): ShinkaiCatalogEntry[] {
  const byId = new Map(catalog.map((a) => [a.id, a]));
  const used = new Set<number>();
  const out: ShinkaiCatalogEntry[] = [];

  for (const def of SHINKAI_FILMS) {
    let anime: CatalogAnime | undefined;
    if (def.id != null) anime = byId.get(def.id);
    if (!anime) {
      anime = catalog.find((a) => {
        if (used.has(a.id)) return false;
        return def.match.test(blob(a));
      });
    }
    if (!anime || used.has(anime.id)) continue;
    used.add(anime.id);
    out.push({ def, anime });
  }

  return out;
}
