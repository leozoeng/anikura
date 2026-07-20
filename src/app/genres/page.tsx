import Image from "next/image";
import Link from "next/link";
import { getCatalog, getGenreStats, getSyncMeta } from "@/lib/catalog";
import {
  genreJp,
  genreWash,
  pickGenreCovers,
  visibleGenres,
} from "@/lib/genre-moods";
import type { CatalogAnime, GenreStat } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GenresPage() {
  const [genresRaw, meta, catalog] = await Promise.all([
    getGenreStats(),
    getSyncMeta(),
    getCatalog(),
  ]);

  const genres = visibleGenres(genresRaw);
  const featured = genres.slice(0, 6);
  const rest = genres.slice(6);
  const covers = pickGenreCovers(catalog, featured);

  return (
    <div className="relative pb-28">
      <header className="relative overflow-hidden border-b border-white/[0.06]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -left-[12%] top-[-30%] h-[70%] w-[55%] rounded-full bg-[radial-gradient(circle,rgba(255,140,170,0.14),transparent_68%)] blur-3xl" />
          <div className="absolute right-[-8%] top-[10%] h-[60%] w-[45%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_70%)] blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#ff8caa]/35 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1200px] px-5 pb-14 pt-28 sm:px-8 sm:pb-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="font-[family-name:var(--font-jp)] text-[0.8rem] tracking-[0.28em] text-sakura-soft/90">
                ジャンル
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-mute uppercase">
                <span className="sakura-dot h-1.5 w-1.5 rounded-full bg-sakura" />
                Moods
              </div>
              <h1 className="mt-5 text-[clamp(2.75rem,7vw,4.6rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-snow">
                Genres
              </h1>
              <p className="mt-4 max-w-lg text-[1.05rem] leading-relaxed text-cloud">
                {meta
                  ? `Pick a mood from ${meta.totalAnime.toLocaleString()} indexed titles — then disappear into the night.`
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

      <div className="mx-auto max-w-[1200px] px-5 pt-12 sm:px-8 sm:pt-14">
        {genres.length === 0 ? (
          <p className="text-mute">
            No genres yet. Run <code className="text-snow">npm run sync</code>.
          </p>
        ) : (
          <>
            <section aria-labelledby="featured-moods">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-eyebrow">いま</p>
                  <h2
                    id="featured-moods"
                    className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.04em] text-snow"
                  >
                    Featured moods
                  </h2>
                </div>
                <p className="hidden text-sm text-mute sm:block">
                  Most watched corners of the catalog
                </p>
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
              <section aria-labelledby="all-moods" className="mt-16 sm:mt-20">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="section-eyebrow">すべて</p>
                    <h2
                      id="all-moods"
                      className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.04em] text-snow"
                    >
                      All moods
                    </h2>
                  </div>
                  <p className="text-sm text-mute">
                    {rest.length} more to wander
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
                  {rest.map((genre, i) => (
                    <Link
                      key={genre.slug}
                      href={`/genres/${genre.slug}`}
                      className="genre-tile group relative flex min-h-[7.25rem] flex-col justify-between overflow-hidden rounded-[1.15rem] px-4 py-4 transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
                      style={{
                        animationDelay: `${Math.min(i, 18) * 28}ms`,
                        background: `linear-gradient(155deg, ${genreWash(genre.slug)} 0%, rgba(12,12,16,0.92) 55%, rgba(0,0,0,0.96) 100%)`,
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
                      }}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition duration-500 group-hover:opacity-100"
                        style={{ background: genreWash(genre.slug) }}
                      />
                      <span className="relative text-[0.68rem] tracking-[0.14em] text-mute uppercase transition group-hover:text-sakura-soft/80">
                        {String(i + 7).padStart(2, "0")}
                      </span>
                      <div className="relative">
                        <span className="block text-[1.05rem] font-medium leading-tight tracking-[-0.03em] text-snow transition duration-300 group-hover:text-sakura-mist">
                          {genre.name}
                        </span>
                        <span className="mt-1.5 flex items-center justify-between text-[0.75rem] text-mute">
                          <span>{genre.count.toLocaleString()}</span>
                          <span className="translate-x-0 text-cloud transition duration-300 group-hover:translate-x-0.5 group-hover:text-sakura-soft">
                            →
                          </span>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function FeaturedMoodTile({
  genre,
  cover,
  index,
}: {
  genre: GenreStat;
  cover?: CatalogAnime;
  index: number;
}) {
  const jp = genreJp(genre.slug);
  const layout =
    index === 0
      ? "genre-tile sm:col-span-2 lg:col-span-7 lg:row-span-2 min-h-[22rem] lg:min-h-[28rem]"
      : index === 1
        ? "genre-tile lg:col-span-5 min-h-[13rem]"
        : index === 2
          ? "genre-tile lg:col-span-5 min-h-[13rem]"
          : "genre-tile lg:col-span-4 min-h-[11rem]";

  return (
    <Link
      href={`/genres/${genre.slug}`}
      className={`group relative overflow-hidden rounded-[1.35rem] ${layout}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="absolute inset-0 bg-elevated" />
      {cover ? (
        <Image
          src={cover.poster}
          alt=""
          fill
          sizes={
            index === 0
              ? "(max-width: 1024px) 100vw, 58vw"
              : "(max-width: 1024px) 50vw, 40vw"
          }
          priority={index < 2}
          className="object-cover transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
        />
      ) : null}

      <div
        className="absolute inset-0 transition duration-500"
        style={{
          background: `
            linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.92) 100%),
            linear-gradient(135deg, ${genreWash(genre.slug)} 0%, transparent 55%)
          `,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px 280px at 20% 80%, ${genreWash(genre.slug)}, transparent 70%)`,
        }}
      />

      <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition duration-500 group-hover:shadow-[inset_0_0_0_1px_rgba(255,140,170,0.35)]" />

      <div
        className={`relative z-10 flex h-full flex-col justify-between p-5 sm:p-6 ${
          index === 0 ? "lg:p-8" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          {jp ? (
            <span className="font-[family-name:var(--font-jp)] text-[0.75rem] tracking-[0.2em] text-sakura-mist/75">
              {jp}
            </span>
          ) : (
            <span />
          )}
          <span className="rounded-full bg-black/35 px-2.5 py-1 text-[0.7rem] tracking-[-0.01em] text-cloud backdrop-blur-md">
            {genre.count.toLocaleString()} titles
          </span>
        </div>

        <div>
          <h3
            className={`font-semibold tracking-[-0.045em] text-snow transition duration-300 group-hover:text-sakura-mist ${
              index === 0
                ? "text-[clamp(2.2rem,4.5vw,3.4rem)]"
                : "text-[clamp(1.45rem,2.5vw,1.9rem)]"
            }`}
          >
            {genre.name}
          </h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-cloud">
            <span>Enter the shelf</span>
            <span className="translate-x-0 transition duration-300 group-hover:translate-x-1 group-hover:text-sakura-soft">
              →
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
