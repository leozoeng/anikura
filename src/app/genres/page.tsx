import { FeaturedMoodTile } from "@/components/featured-mood-tile";
import { MoodJumpRail } from "@/components/mood-jump-rail";
import { MoodTeaser } from "@/components/mood-teaser";
import { getCatalog, getGenreStats, getSyncMeta } from "@/lib/catalog";
import {
  pickGenreCovers,
  pickGenrePreviews,
  visibleGenres,
} from "@/lib/genre-moods";
import { fetchMoodArtOverrides } from "@/lib/mood-art";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Genres & Moods",
  description:
    "Browse Anikura by mood — cinematic shelves of comedy, romance, action, and more.",
};

const FEATURED_COUNT = 6;

export default async function GenresPage() {
  const [genresRaw, meta, catalog, moodOverrides] = await Promise.all([
    getGenreStats(),
    getSyncMeta(),
    getCatalog(),
    fetchMoodArtOverrides(),
  ]);

  const genres = visibleGenres(genresRaw);
  const featured = genres.slice(0, FEATURED_COUNT);
  const rest = genres.slice(FEATURED_COUNT);
  const covers = pickGenreCovers(catalog, genres, moodOverrides);
  const previews = pickGenrePreviews(catalog, genres, 7);
  const jumpChips = genres.slice(0, 18).map((g) => ({
    slug: g.slug,
    name: g.name,
  }));

  return (
    <div className="page-enter relative pb-24">
      <header className="relative overflow-hidden border-b border-white/[0.06]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-[10%] top-[-40%] h-[55%] w-[42%] rounded-full bg-[radial-gradient(circle,rgba(255,140,170,0.12),transparent_68%)] blur-3xl" />
          <div className="absolute right-[-8%] top-[0%] h-[50%] w-[36%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.04),transparent_70%)] blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-[1200px] flex-wrap items-end justify-between gap-4 px-5 pb-5 pt-24 sm:gap-6 sm:px-8 sm:pb-6 sm:pt-28">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-medium tracking-[0.16em] text-mute uppercase">
              <span className="sakura-dot h-1.5 w-1.5 rounded-full bg-sakura" />
              Moods
            </div>
            <h1 className="mt-2.5 text-[clamp(2rem,5vw,3rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-snow">
              Genres
            </h1>
            <p className="mt-1.5 max-w-md text-sm text-cloud sm:text-[0.9375rem]">
              {meta
                ? `Featured mosaic, then themed shelves · ${meta.totalAnime.toLocaleString()} titles`
                : "Sync the catalog to unlock genre browsing."}
            </p>
          </div>

          {genres.length > 0 ? (
            <div className="flex items-baseline gap-5 text-right">
              <div>
                <p className="text-xl font-semibold tracking-[-0.04em] text-snow tabular-nums sm:text-2xl">
                  {genres.length}
                </p>
                <p className="text-[0.65rem] tracking-[0.14em] text-mute uppercase">
                  moods
                </p>
              </div>
              {meta ? (
                <div>
                  <p className="text-xl font-semibold tracking-[-0.04em] text-sakura-soft tabular-nums sm:text-2xl">
                    {meta.totalAnime.toLocaleString()}
                  </p>
                  <p className="text-[0.65rem] tracking-[0.14em] text-mute uppercase">
                    titles
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-5 pt-5 sm:px-8 sm:pt-6">
        {genres.length === 0 ? (
          <p className="text-mute">
            No genres yet. Run <code className="text-snow">npm run sync</code>.
          </p>
        ) : (
          <>
            <MoodJumpRail chips={jumpChips} />

            <section aria-labelledby="featured-moods">
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2
                  id="featured-moods"
                  className="text-lg font-semibold tracking-[-0.03em] text-snow sm:text-xl"
                >
                  Featured
                </h2>
                <p className="text-xs text-mute sm:text-sm">
                  Most watched corners
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-12 lg:gap-3">
                {featured.map((genre, i) => (
                  <FeaturedMoodTile
                    key={genre.slug}
                    genre={genre}
                    cover={covers.get(genre.slug)}
                    index={i}
                  />
                ))}
              </div>
            </section>

            {rest.length > 0 ? (
              <section aria-labelledby="more-moods" className="mt-10 sm:mt-12">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h2
                      id="more-moods"
                      className="text-lg font-semibold tracking-[-0.03em] text-snow sm:text-xl"
                    >
                      More moods
                    </h2>
                    <p className="mt-0.5 text-xs text-mute sm:text-sm">
                      Compact themed shelves
                    </p>
                  </div>
                  <p className="text-xs tabular-nums text-mute">
                    {rest.length}
                  </p>
                </div>

                <div className="flex flex-col gap-3.5 sm:gap-4">
                  {rest.map((genre, i) => {
                    const cover = covers.get(genre.slug);
                    return (
                      <MoodTeaser
                        key={genre.slug}
                        name={genre.name}
                        slug={genre.slug}
                        count={genre.count}
                        coverSrc={cover?.src}
                        coverPosition={cover?.position}
                        posters={previews.get(genre.slug) ?? []}
                        priority={i < 2}
                      />
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
