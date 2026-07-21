import { AnimePoster } from "@/components/anime-poster";
import { OnePieceHero } from "@/components/one-piece-hero";
import { resolveAniListForAnime } from "@/lib/anilist";
import { getCatalog } from "@/lib/catalog";
import {
  getOnePieceCollection,
  onePieceFilmCount,
  type OnePieceCatalogEntry,
} from "@/lib/one-piece";

export const metadata = {
  title: "One Piece Voyage",
  description:
    "The Grand Line on Anikura — the main series and iconic One Piece films.",
};

export const dynamic = "force-dynamic";

const TRAILER_PRIORITY = [
  /film:? ?red/i,
  /film:? ?gold/i,
  /film z|movie 12/i,
  /strong world(?! episode)/i,
  /^one piece$/i,
];

async function resolveHeroTrailer(entries: OnePieceCatalogEntry[]) {
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
  }

  const fallback = entries[0];
  return {
    trailerId: null as string | null,
    title: fallback?.def.title ?? "One Piece",
    poster:
      fallback?.anime.background_image ||
      fallback?.anime.poster ||
      "/anikura-mark.png",
  };
}

export default async function OnePiecePage() {
  const catalog = await getCatalog();
  const entries = getOnePieceCollection(catalog);
  const films = onePieceFilmCount(entries);
  const hero = await resolveHeroTrailer(entries);

  return (
    <div className="page-enter relative pb-24">
      <OnePieceHero
        trailerId={hero.trailerId}
        posterSrc={hero.poster}
        title={hero.title}
        entryCount={entries.length}
        filmCount={films}
      />

      <div className="page-shell relative pt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-64"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(58,160,232,0.12), transparent 70%)",
          }}
        />

        <div className="flex flex-wrap items-center gap-2 border-b border-[#f0a35a]/12 pb-5">
          <p className="text-sm text-[#8aa8c0]">
            Chronological · {entries.length} shown
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="mt-16 text-center text-[#8aa8c0]">
            No One Piece titles found in the catalog yet.
          </p>
        ) : (
          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {entries.map(({ anime, def }, i) => (
              <div key={anime.id} className="featured-card group relative">
                <AnimePoster anime={anime} index={i} />
                {def.film ? (
                  <span className="pointer-events-none absolute left-2 top-2 z-[1] rounded-full bg-[#0a1c2e]/75 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-[#ffd28a] ring-1 ring-[#f0a35a]/35 backdrop-blur-sm">
                    Film
                  </span>
                ) : null}
                {def.series ? (
                  <span className="pointer-events-none absolute left-2 top-2 z-[1] rounded-full bg-[#0a1c2e]/75 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-[#7ec8ff] ring-1 ring-[#3aa0e8]/35 backdrop-blur-sm">
                    Series
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
