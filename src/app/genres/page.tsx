import { FeaturedMoodTile } from "@/components/featured-mood-tile";
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
  const previews = pickGenrePreviews(catalog, genres, 8);

  return (
    <div className="page-enter relative pb-24">
      <header className="relative overflow-hidden border-b border-white/[0.06]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-[12%] top-[-30%] h-[70%] w-[55%] rounded-full bg-[radial-gradient(circle,rgba(255,140,170,0.14),transparent_68%)] blur-3xl" />
          <div className="absolute right-[-8%] top-[10%] h-[60%] w-[45%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_70%)] blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#ff8caa]/35 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1200px] px-5 pb-10 pt-28 sm:px-8 sm:pb-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-mute uppercase">
                <span className="sakura-dot h-1.5 w-1.5 rounded-full bg-sakura" />
                Moods
              </div>
              <h1 className="mt-5 text-[clamp(2.75rem,7vw,4.6rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-snow">
                Genres
              </h1>
              <p className="mt-4 max-w-lg text-[1.05rem] leading-relaxed text-cloud">
                {meta
                  ? `Big featured moods up top — then themed shelves from ${meta.totalAnime.toLocaleString()} titles.`
                  : "Sync the catalog to unlock genre browsing."}
              </p>
            </div>

            {genres.length > 0 ? (
              <div className="flex items-baseline gap-6 text-right">
                <div>
                  <p className="text-[clamp(2rem,4vw,2.75rem)] font-semibold tracking-[-0.04em] text-snow">
                    {genres.length}
                  </p>
                  <p className="mt-1 text-[0.7rem] tracking-[0.16em] text-mute uppercase">
                    moods
                  </p>
                </div>
                {meta ? (
                  <div>
                    <p className="text-[clamp(2rem,4vw,2.75rem)] font-semibold tracking-[-0.04em] text-sakura-soft">
                      {meta.totalAnime.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[0.7rem] tracking-[0.16em] text-mute uppercase">
                      titles
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-5 pt-8 sm:px-8 sm:pt-10">
        {genres.length === 0 ? (
          <p className="text-mute">
            No genres yet. Run <code className="text-snow">npm run sync</code>.
          </p>
        ) : (
          <>
            <section aria-labelledby="featured-moods">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2
                    id="featured-moods"
                    className="text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.04em] text-snow"
                  >
                    Featured moods
                  </h2>
                  <p className="mt-1 text-sm text-mute">
                    Most watched corners of the catalog
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-12 lg:gap-4">
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
              <section aria-labelledby="more-moods" className="mt-12 sm:mt-14">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2
                      id="more-moods"
                      className="text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.04em] text-snow"
                    >
                      More moods
                    </h2>
                    <p className="mt-1 text-sm text-mute">
                      Themed shelves — each with its own color and vibe
                    </p>
                  </div>
                  <p className="hidden text-sm tabular-nums text-mute sm:block">
                    {rest.length} more
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-5 sm:gap-6">
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
