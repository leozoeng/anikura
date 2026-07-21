import type { CatalogAnime } from "@/lib/types";

/**
 * Studio Ghibli feature films (theatrical + major TV films), chronological.
 * Catalog ids are pinned where known; title matchers cover sync drift.
 */
export type GhibliFilmDef = {
  /** Preferred catalog id when present */
  id?: number;
  /** Match against title / alternative / native (case-insensitive) */
  match: RegExp;
  year: number;
  /** Directed by Hayao Miyazaki */
  miyazaki?: boolean;
  title: string;
};

export const GHIBLI_FILMS: GhibliFilmDef[] = [
  {
    id: 1393,
    title: "Nausicaä of the Valley of the Wind",
    year: 1984,
    miyazaki: true,
    match: /nausica/i,
  },
  {
    id: 1411,
    title: "Castle in the Sky",
    year: 1986,
    miyazaki: true,
    match: /castle in the sky|laputa/i,
  },
  {
    id: 1646,
    title: "Grave of the Fireflies",
    year: 1988,
    match: /grave of the fireflies/i,
  },
  {
    id: 1421,
    title: "My Neighbor Totoro",
    year: 1988,
    miyazaki: true,
    match: /my neighbor totoro|tonari no totoro/i,
  },
  {
    id: 1259,
    title: "Kiki's Delivery Service",
    year: 1989,
    miyazaki: true,
    match: /kiki'?s delivery service|majo no takkyuubin/i,
  },
  {
    id: 200,
    title: "Only Yesterday",
    year: 1991,
    match: /only yesterday|omohide poroporo/i,
  },
  {
    id: 1102,
    title: "Porco Rosso",
    year: 1992,
    miyazaki: true,
    match: /porco rosso/i,
  },
  {
    id: 3689,
    title: "The Ocean Waves",
    year: 1993,
    match: /ocean waves|umi ga kikoeru/i,
  },
  {
    id: 1774,
    title: "Pom Poko",
    year: 1994,
    match: /pom poko|heisei tanuki/i,
  },
  {
    id: 1329,
    title: "Whisper of the Heart",
    year: 1995,
    match: /whisper of the heart|mimi wo sumaseba/i,
  },
  {
    id: 1562,
    title: "Princess Mononoke",
    year: 1997,
    miyazaki: true,
    match: /^princess mononoke$|mononoke-hime|mononoke hime/i,
  },
  {
    id: 2420,
    title: "My Neighbors the Yamadas",
    year: 1999,
    match: /neighbors the yamadas|houhokekyo/i,
  },
  {
    id: 1510,
    title: "Spirited Away",
    year: 2001,
    miyazaki: true,
    match: /spirited away|sen to chihiro/i,
  },
  {
    id: 1010,
    title: "The Cat Returns",
    year: 2002,
    match: /cat returns|neko no ongaeshi/i,
  },
  {
    id: 1549,
    title: "Howl's Moving Castle",
    year: 2004,
    miyazaki: true,
    match: /howl'?s moving castle|howl no ugoku/i,
  },
  {
    id: 3150,
    title: "Tales from Earthsea",
    year: 2006,
    match: /tales from earthsea|gedo senki/i,
  },
  {
    id: 963,
    title: "Ponyo",
    year: 2008,
    miyazaki: true,
    match: /^ponyo$|ponyo on the cliff|gake no ue no ponyo/i,
  },
  {
    id: 1141,
    title: "The Secret World of Arrietty",
    year: 2010,
    match: /arrietty|karigurashi no arietti/i,
  },
  {
    id: 945,
    title: "From Up on Poppy Hill",
    year: 2011,
    match: /from up on poppy hill|kokuriko-zaka/i,
  },
  {
    id: 1484,
    title: "The Wind Rises",
    year: 2013,
    miyazaki: true,
    match: /the wind rises|kaze tachinu/i,
  },
  {
    id: 1318,
    title: "The Tale of the Princess Kaguya",
    year: 2013,
    match: /tale of the princess kaguya|kaguya-hime no monogatari/i,
  },
  {
    id: 1493,
    title: "When Marnie Was There",
    year: 2014,
    match: /when marnie was there|omoiide no marnie/i,
  },
  {
    id: 5743,
    title: "Earwig and the Witch",
    year: 2020,
    match: /earwig and the witch|aya to majo/i,
  },
  {
    id: 5868,
    title: "The Boy and the Heron",
    year: 2023,
    miyazaki: true,
    match: /boy and the heron|how do you live|kimitachi wa dou/i,
  },
];

export type GhibliCatalogEntry = {
  def: GhibliFilmDef;
  anime: CatalogAnime;
};

function blob(anime: CatalogAnime) {
  return [anime.title, anime.alternative, anime.native, anime.titles]
    .filter(Boolean)
    .join(" · ");
}

/** Resolve the full Ghibli shelf from the local catalog, chronological. */
export function getGhibliCollection(
  catalog: CatalogAnime[],
): GhibliCatalogEntry[] {
  const byId = new Map(catalog.map((a) => [a.id, a]));
  const used = new Set<number>();
  const out: GhibliCatalogEntry[] = [];

  for (const def of GHIBLI_FILMS) {
    let anime: CatalogAnime | undefined;
    if (def.id != null) anime = byId.get(def.id);
    if (!anime) {
      anime = catalog.find((a) => {
        if (used.has(a.id)) return false;
        return def.match.test(blob(a));
      });
    }
    // Princess Mononoke: avoid matching Mononoke the Movie series
    if (anime && /mononoke/i.test(def.title)) {
      const t = anime.title.toLowerCase();
      if (t.includes("mononoke the movie") || t === "mononoke") {
        anime = catalog.find(
          (a) =>
            !used.has(a.id) &&
            /^princess mononoke$/i.test(a.title.trim()),
        );
      }
    }
    if (!anime || used.has(anime.id)) continue;
    used.add(anime.id);
    out.push({ def, anime });
  }

  return out;
}

export function ghibliMiyazakiCount(entries: GhibliCatalogEntry[]) {
  return entries.filter((e) => e.def.miyazaki).length;
}
