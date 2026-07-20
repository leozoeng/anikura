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
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    { anime: recent },
    catalog,
    topRated,
    airing,
    genres,
    meta,
    trending,
    seasonal,
  ] = await Promise.all([
    getRecentAnime(1, 24),
    getCatalog(),
    getTopRated(18),
    getByStatus("Currently Airing", 18),
    getGenreStats(),
    getSyncMeta(),
    getTrendingAnime(18),
    getPopularThisSeason(18),
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

  // Build hero slides from recent titles that map to AniList (prefer trailers)
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

  const fantasy = catalog
    .filter((a) => a.genres.includes("Fantasy"))
    .slice(0, 18);

  const genreList = genres.length
    ? genres.slice(0, 10)
    : Array.from(new Set(recent.flatMap((a) => getGenres(a)))).map((name) => ({
        name,
        slug: slugifyGenre(name),
        count: 0,
      }));

  return (
    <div className="pb-10">
      <Hero slides={slides} />

      <div className="relative z-10 space-y-16 pt-10 sm:space-y-20 sm:pt-14">
        <ContinueWatching />

        <MyListRow />

        <AniListRow
          title="Trending now"
          subtitle="What people are watching"
          media={trending}
          hrefForId={hrefForAniList}
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

        <section className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">Genres</h2>
              <p className="section-sub">
                {meta
                  ? `${meta.totalAnime.toLocaleString()} titles in your library`
                  : "Sync the catalog to unlock deeper browsing"}
              </p>
            </div>
            <Link href="/genres" className="link-quiet text-sm">
              View all
            </Link>
          </div>

          <div className="mt-8 divide-y divide-white/8 border-y border-white/8">
            {genreList.map((g) => (
              <Link
                key={g.slug}
                href={`/genres/${g.slug}`}
                className="group flex items-center justify-between py-4 transition hover:bg-white/[0.03]"
              >
                <span className="text-[1.05rem] tracking-[-0.02em] text-snow transition group-hover:translate-x-1">
                  {g.name}
                </span>
                <span className="text-sm text-mute">
                  {g.count > 0 ? g.count.toLocaleString() : "Explore"}
                  <span className="ml-3 text-cloud transition group-hover:text-snow">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
