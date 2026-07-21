import { AnimePoster } from "@/components/anime-poster";
import { ShinkaiHero } from "@/components/shinkai-hero";
import { resolveAniListForAnime } from "@/lib/anilist";
import { getCatalog } from "@/lib/catalog";
import {
  getShinkaiCollection,
  type ShinkaiCatalogEntry,
} from "@/lib/shinkai";

export const metadata = {
  title: "Makoto Shinkai",
  description:
    "Skies, rain, and quiet longing — Makoto Shinkai films on Anikura.",
};

export const dynamic = "force-dynamic";

const TRAILER_PRIORITY = [
  /your name/i,
  /suzume/i,
  /weathering with you/i,
  /garden of words/i,
  /5 centimeters/i,
];

/** Known YouTube trailers when AniList is missing/slow — Your Name first. */
const TRAILER_FALLBACKS: { match: RegExp; youtubeId: string }[] = [
  { match: /your name/i, youtubeId: "k4xGqY5IDBE" },
  { match: /suzume/i, youtubeId: "g0JMPkn7Wuo" },
  { match: /weathering with you/i, youtubeId: "Q6iK6DjV_iE" },
];

async function resolveHeroTrailer(entries: ShinkaiCatalogEntry[]) {
  for (const re of TRAILER_PRIORITY) {
    const entry = entries.find((e) => re.test(e.def.title));
    if (!entry) continue;
    const media = await resolveAniListForAnime(entry.anime);
    const trailer = media?.trailer;
    if (trailer?.site?.toLowerCase() === "youtube" && trailer.id) {
      return {
        trailerId: trailer.id,
        title: entry.def.title,
        poster:
          media?.bannerImage ||
          entry.anime.background_image ||
          entry.anime.poster,
      };
    }
    const pinned = TRAILER_FALLBACKS.find((f) => f.match.test(entry.def.title));
    if (pinned) {
      return {
        trailerId: pinned.youtubeId,
        title: entry.def.title,
        poster:
          media?.bannerImage ||
          entry.anime.background_image ||
          entry.anime.poster,
      };
    }
  }

  const fallback = entries[0];
  return {
    trailerId: null as string | null,
    title: fallback?.def.title ?? "Makoto Shinkai",
    poster:
      fallback?.anime.background_image ||
      fallback?.anime.poster ||
      "/anikura-mark.png",
  };
}

export default async function ShinkaiPage() {
  const catalog = await getCatalog();
  const entries = getShinkaiCollection(catalog);
  const hero = await resolveHeroTrailer(entries);

  return (
    <div className="page-enter relative pb-24">
      <ShinkaiHero
        trailerId={hero.trailerId}
        posterSrc={hero.poster}
        title={hero.title}
        filmCount={entries.length}
      />

      <div className="page-shell relative pt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-64"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(120,170,255,0.12), transparent 70%)",
          }}
        />

        <div className="flex flex-wrap items-center gap-2 border-b border-[#8bb4e8]/12 pb-5">
          <p className="text-sm text-[#8a9ab8]">
            Chronological · {entries.length} shown
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="mt-16 text-center text-[#8a9ab8]">
            No Shinkai films found in the catalog yet.
          </p>
        ) : (
          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {entries.map(({ anime }, i) => (
              <AnimePoster key={anime.id} anime={anime} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
