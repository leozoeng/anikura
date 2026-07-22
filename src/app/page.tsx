import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { AniListRow } from "@/components/anilist-row";
import { AnimeRow } from "@/components/anime-row";
import { ContinueWatching } from "@/components/continue-watching";
import { MyListRow } from "@/components/my-list-row";
import { Hero, type HeroSlide } from "@/components/hero";
import {
  getAniListByIds,
  getPopularThisSeason,
  getTrendingAnime,
} from "@/lib/anilist";
import { getGenres, getRecentAnime, slugifyGenre } from "@/lib/anikoto";
import {
  getByStatus,
  getCatalog,
  getGenreStats,
  getSyncMeta,
  getTopRated,
} from "@/lib/catalog";
import {
  genreWash,
  moodAccent,
  pickGenreCovers,
  visibleGenres,
} from "@/lib/genre-moods";
import { fetchMoodArtOverrides } from "@/lib/mood-art";
import type { CSSProperties } from "react";

/** Cache the home shell so refresh isn't blocked on cold API waits. */
export const revalidate = 120;

function HeroShell() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-void/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-void/80 via-void/30 to-transparent" />
      <div className="page-shell relative flex min-h-[100svh] flex-col justify-end pb-16 pt-28 lg:pb-24">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-snow/70">
          Anikura
        </p>
        <div className="mt-6 h-14 w-[min(100%,18rem)] rounded-sm bg-white/8" />
        <div className="mt-5 h-4 w-full max-w-md rounded-sm bg-white/5" />
        <div className="mt-2 h-4 w-3/4 max-w-sm rounded-sm bg-white/5" />
        <div className="mt-8 flex gap-3">
          <div className="h-11 w-24 rounded-full bg-white/12" />
          <div className="h-11 w-28 rounded-full bg-white/6" />
        </div>
      </div>
    </section>
  );
}

async function HomeHero() {
  const { anime: recent } = await getRecentAnime(1, 24);

  const heroCandidates = recent
    .map((anime) => ({
      anime,
      aniId: Number(anime.ani_id) || 0,
    }))
    .filter((x) => x.aniId > 0)
    .slice(0, 12);

  const heroAni = await getAniListByIds(heroCandidates.map((x) => x.aniId));
  const aniMap = new Map(heroAni.map((m) => [m.id, m]));

  const slides: HeroSlide[] = heroCandidates
    .map(({ anime, aniId }) => ({
      anime,
      anilist: aniMap.get(aniId) || null,
    }))
    .sort((a, b) => {
      const at =
        a.anilist?.trailer?.site?.toLowerCase() === "youtube" ? 1 : 0;
      const bt =
        b.anilist?.trailer?.site?.toLowerCase() === "youtube" ? 1 : 0;
      return bt - at;
    })
    .slice(0, 5);

  if (!slides.length && recent[0]) {
    slides.push({ anime: recent[0], anilist: null });
  }

  return <Hero slides={slides} />;
}

async function HomeRows() {
  const [
    { anime: recent },
    catalog,
    topRated,
    airing,
    genres,
    meta,
    trending,
    seasonal,
    moodOverrides,
  ] = await Promise.all([
    getRecentAnime(1, 24),
    getCatalog(),
    getTopRated(18),
    getByStatus("Currently Airing", 18),
    getGenreStats(),
    getSyncMeta(),
    getTrendingAnime(18),
    getPopularThisSeason(18),
    fetchMoodArtOverrides(),
  ]);

  const byAniId = new Map<number, (typeof catalog)[number]>();
  for (const item of catalog) {
    const id = Number(item.ani_id);
    if (id) byAniId.set(id, item);
  }

  const hrefForAniList = (aniListId: number) => {
    const match = byAniId.get(aniListId);
    return match ? `/anime/${match.id}/${match.slug}` : null;
  };

  const fantasy = catalog
    .filter((a) => a.genres.includes("Fantasy"))
    .slice(0, 18);

  const genreList = genres.length
    ? visibleGenres(genres).slice(0, 10)
    : Array.from(new Set(recent.flatMap((a) => getGenres(a))))
        .slice(0, 10)
        .map((name) => ({
          name,
          slug: slugifyGenre(name),
          count: 0,
        }));

  const genreCovers = pickGenreCovers(catalog, genreList, moodOverrides);

  return (
    <div className="page-shell relative z-10 space-y-12 pt-8 sm:space-y-14 sm:pt-10">
      <ContinueWatching />

      <MyListRow />

      <AniListRow
        title="Trending now"
        subtitle="What people are watching"
        media={trending}
        hrefForId={hrefForAniList}
        priorityCount={3}
      />

      <AniListRow
        title="This season"
        subtitle="Popular right now"
        media={seasonal}
        hrefForId={hrefForAniList}
      />

      <AnimeRow
        title="New on Anikura"
        subtitle="Freshly updated titles"
        href="/browse"
        anime={recent}
      />

      {airing.length > 0 && (
        <AnimeRow
          title="Now airing"
          subtitle="Episodes landing now"
          anime={airing}
        />
      )}

      {topRated.length > 0 && (
        <AnimeRow
          title="Highly rated"
          subtitle="From your library"
          href="/browse?sort=score"
          anime={topRated}
        />
      )}

      {fantasy.length > 0 && (
        <AnimeRow title="Fantasy" href="/genres/fantasy" anime={fantasy} />
      )}

      <section className="page-enter space-y-5">
        <div className="flex w-full items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Genres</h2>
            <p className="section-sub">
              {meta
                ? `${meta.totalAnime.toLocaleString()} titles · pick a mood`
                : "Sync the catalog to unlock deeper browsing"}
            </p>
          </div>
          <Link href="/genres" className="link-quiet text-sm">
            View all →
          </Link>
        </div>

        <div className="fade-x scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-3.5">
          {genreList.map((g, i) => {
            const cover = genreCovers.get(g.slug);
            const accent = moodAccent(g.slug);
            const wash = genreWash(g.slug);
            return (
              <Link
                key={g.slug}
                href={`/genres/${g.slug}`}
                className="genre-tile pressable group relative h-[9.5rem] w-[9.75rem] shrink-0 snap-start overflow-hidden rounded-[1.2rem] sm:h-[10.5rem] sm:w-[11rem]"
                style={
                  {
                    animationDelay: `${Math.min(i, 9) * 28}ms`,
                    "--genre-tile-accent": accent.solid,
                  } as CSSProperties
                }
              >
                <div className="absolute inset-0 bg-elevated" />
                {cover ? (
                  <Image
                    src={cover.src}
                    alt=""
                    fill
                    sizes="180px"
                    className={`object-cover transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05] ${cover.position ?? "object-center"}`}
                  />
                ) : null}
                <div
                  className="absolute inset-0 transition duration-500"
                  style={{
                    background: `
                      linear-gradient(180deg, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.38) 40%, rgba(0,0,0,0.88) 78%, rgba(0,0,0,0.96) 100%),
                      linear-gradient(135deg, ${wash} 0%, transparent 54%),
                      radial-gradient(ellipse 90% 48% at 50% 110%, ${accent.solid}28, transparent 68%)
                    `,
                  }}
                />
                <div
                  aria-hidden
                  className="mood-cloud pointer-events-none absolute -left-[18%] top-[8%] h-12 w-[55%] rounded-full blur-3xl opacity-55 transition duration-500 group-hover:opacity-90"
                  style={{ background: `${accent.solid}2e` }}
                />
                <div
                  aria-hidden
                  className="mood-cloud-slow pointer-events-none absolute -right-[14%] bottom-[12%] h-10 w-[48%] rounded-full blur-3xl opacity-40 transition duration-500 group-hover:opacity-70"
                  style={{ background: `${accent.soft}24` }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(420px 220px at 20% 92%, ${accent.solid}42, transparent 70%)`,
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-50 transition duration-500 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent 6%, ${accent.soft}55 50%, transparent 94%)`,
                  }}
                />
                <div className="relative z-10 flex h-full flex-col justify-end p-3.5 sm:p-4">
                  <div>
                    <span
                      aria-hidden
                      className="sakura-dot mb-1.5 block h-1.5 w-1.5 rounded-full"
                      style={{ background: accent.solid }}
                    />
                    <span
                      className="block text-[1.05rem] font-medium leading-tight tracking-[-0.03em] text-snow transition duration-300"
                      style={{
                        textShadow: `0 2px 22px color-mix(in oklab, ${accent.solid} 38%, transparent), 0 1px 2px rgba(0,0,0,0.6)`,
                      }}
                    >
                      {g.name}
                    </span>
                    <span className="mt-1 flex items-center justify-between text-[0.72rem]">
                      <span
                        className="tabular-nums transition duration-300"
                        style={{ color: accent.mist }}
                      >
                        {g.count > 0 ? g.count.toLocaleString() : "Explore"}
                      </span>
                      <span
                        aria-hidden
                        className="translate-x-0 transition duration-300 group-hover:translate-x-0.5"
                        style={{ color: accent.soft }}
                      >
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="pb-6">
      <Suspense fallback={<HeroShell />}>
        <HomeHero />
      </Suspense>

      <Suspense fallback={null}>
        <HomeRows />
      </Suspense>
    </div>
  );
}
