import { SafeImage } from "@/components/safe-image";
import { MangaPoster } from "@/components/manga/manga-poster";
import { MangaRow } from "@/components/manga/manga-row";
import { PagePagination } from "@/components/page-pagination";
import {
  MANGA_SHELF_GENRES,
  browseManga,
  getMangaByGenre,
  getRecentlyUpdatedManga,
  getTrendingManga,
  mangaGenreBySlug,
  searchManga,
  type MangaBrowseSort,
} from "@/lib/atsu";
import { genreWash, moodAccent } from "@/lib/genre-moods";
import type { MangaListItem } from "@/lib/manga-types";
import Link from "next/link";
import type { CSSProperties } from "react";

export const revalidate = 120;

type Props = {
  searchParams: Promise<{
    sort?: string;
    page?: string;
    q?: string;
    genre?: string;
  }>;
};

function parseSort(raw: string | undefined): MangaBrowseSort {
  if (raw === "trending" || raw === "latest" || raw === "rating") return raw;
  return "popular";
}

function sortLabel(sort: MangaBrowseSort) {
  if (sort === "trending") return "Trending";
  if (sort === "latest") return "Latest";
  if (sort === "rating") return "Top rated";
  return "Most popular";
}

/** Prefer distinct art per genre tile — avoid the same mega-hit on every mood. */
function pickUniqueGenreCovers(pools: MangaListItem[][]) {
  const used = new Set<string>();
  const out = new Map<string, string | null>();

  MANGA_SHELF_GENRES.forEach((g, i) => {
    const pool = pools[i] || [];
    const pick =
      pool.find((item) => item.poster && !used.has(item.poster))?.poster ??
      pool.find((item) => item.poster)?.poster ??
      null;
    if (pick) used.add(pick);
    out.set(g.slug, pick);
  });

  return out;
}

function genrePool(slug: string, pools: MangaListItem[][]) {
  const idx = MANGA_SHELF_GENRES.findIndex((g) => g.slug === slug);
  return idx >= 0 ? (pools[idx] || []).slice(0, 18) : [];
}

export default async function MangaPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const genre = mangaGenreBySlug(params.genre);
  const sort = parseSort(params.sort);
  const page = Math.max(1, Number(params.page || 1));
  const isHome = !query && !genre && !params.sort;

  let trending: MangaListItem[] = [];
  let popular: MangaListItem[] = [];
  let latest: MangaListItem[] = [];
  let topRated: MangaListItem[] = [];
  let action: MangaListItem[] = [];
  let fantasy: MangaListItem[] = [];
  let romance: MangaListItem[] = [];
  let genreCovers = new Map<string, string | null>();
  let shelfItems: MangaListItem[] = [];
  let searchItems: MangaListItem[] = [];
  let found = 0;
  let loadError: string | null = null;

  try {
    if (query) {
      const result = await searchManga(query, page, 48);
      searchItems = result.items;
      found = result.found;
    } else if (genre || params.sort) {
      const result = await browseManga({
        sort: genre
          ? sort === "trending"
            ? "popular"
            : sort
          : sort,
        genre: genre?.slug,
        page,
        limit: 48,
      });
      shelfItems = result.items;
      found = result.found;
    } else {
      const [trendingItems, popularResult, latestItems, ratingResult, ...pools] =
        await Promise.all([
          getTrendingManga(0, "Manga"),
          browseManga({ sort: "popular", limit: 18 }),
          getRecentlyUpdatedManga(0, "Manga"),
          browseManga({ sort: "rating", limit: 18 }),
          ...MANGA_SHELF_GENRES.map((g) => getMangaByGenre(g.slug, 12)),
        ]);

      trending = trendingItems.slice(0, 18);
      popular = popularResult.items;
      latest = latestItems.slice(0, 18);
      topRated = ratingResult.items;
      action = genrePool("action", pools);
      fantasy = genrePool("fantasy", pools);
      romance = genrePool("romance", pools);
      genreCovers = pickUniqueGenreCovers(pools);
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load manga";
  }

  const totalPages = Math.max(1, Math.ceil(found / 48));
  const browseTitle = genre
    ? genre.name
    : query
      ? `Results for “${query}”`
      : sortLabel(sort);

  return (
    <div className="pb-16">
      <div className="page-shell page-enter relative pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
        >
          <div className="absolute left-[-8%] top-8 h-48 w-[42%] rounded-full bg-[radial-gradient(circle,rgba(255,140,170,0.12),transparent_68%)] blur-3xl" />
          <div className="absolute right-[-6%] top-16 h-40 w-[36%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.04),transparent_70%)] blur-3xl" />
        </div>

        <h1 className="text-[clamp(2.4rem,6vw,4rem)] font-semibold tracking-[-0.05em] text-snow">
          Manga
        </h1>
        <p className="mt-3 max-w-xl text-cloud">
          Trending, popular, and genre shelves.
        </p>

        <form action="/manga" method="get" className="mt-8 max-w-xl">
          <label className="sr-only" htmlFor="manga-search">
            Search manga
          </label>
          <div className="flex gap-2">
            <input
              id="manga-search"
              name="q"
              defaultValue={query}
              placeholder="Search titles…"
              className="h-12 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm text-snow outline-none placeholder:text-mute focus:border-sakura/40"
            />
            <button type="submit" className="btn-primary shrink-0 !px-5">
              Search
            </button>
          </div>
        </form>
      </div>

      {loadError ? (
        <div className="page-shell mt-16 border border-dashed border-white/15 px-8 py-14 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">
            Couldn&apos;t reach the library
          </h2>
          <p className="mx-auto mt-3 max-w-md text-mute">{loadError}</p>
        </div>
      ) : null}

      {!loadError && isHome ? (
        <div className="page-shell relative z-10 space-y-12 pt-10 sm:space-y-14">
          <MangaRow
            title="Trending now"
            subtitle="What people are reading"
            items={trending}
            seeAllHref="/manga?sort=trending"
            priorityCount={3}
          />
          <MangaRow
            title="Most popular"
            subtitle="All-time views on the shelf"
            items={popular}
            seeAllHref="/manga?sort=popular"
          />
          <MangaRow
            title="Latest updates"
            subtitle="Fresh chapters dropping now"
            items={latest}
            seeAllHref="/manga?sort=latest"
          />
          <MangaRow
            title="Highly rated"
            subtitle="Critically loved titles"
            items={topRated}
            seeAllHref="/manga?sort=rating"
          />
          <MangaRow
            title="Action"
            items={action}
            seeAllHref="/manga?genre=action"
          />
          <MangaRow
            title="Fantasy"
            items={fantasy}
            seeAllHref="/manga?genre=fantasy"
          />
          <MangaRow
            title="Romance"
            items={romance}
            seeAllHref="/manga?genre=romance"
          />

          <section className="page-enter space-y-5">
            <div className="flex w-full items-end justify-between gap-4">
              <div>
                <h2 className="section-title">Genres</h2>
                <p className="section-sub">Pick a mood</p>
              </div>
            </div>
            <div className="fade-x scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-3.5">
              {MANGA_SHELF_GENRES.map((g, i) => {
                const cover = genreCovers.get(g.slug);
                const accent = moodAccent(g.slug);
                const wash = genreWash(g.slug);
                return (
                  <Link
                    key={g.slug}
                    href={`/manga?genre=${g.slug}`}
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
                      <SafeImage
                        src={cover}
                        alt=""
                        fill
                        sizes="180px"
                        className="object-cover object-center transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
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
                    <div className="relative z-10 flex h-full flex-col justify-end p-3.5 sm:p-4">
                      <span
                        aria-hidden
                        className="sakura-dot mb-1.5 block h-1.5 w-1.5 rounded-full"
                        style={{ background: accent.solid }}
                      />
                      <span
                        className="block text-[1.05rem] font-medium leading-tight tracking-[-0.03em] text-snow"
                        style={{
                          textShadow: `0 2px 22px color-mix(in oklab, ${accent.solid} 38%, transparent), 0 1px 2px rgba(0,0,0,0.6)`,
                        }}
                      >
                        {g.name}
                      </span>
                      <span
                        aria-hidden
                        className="mt-1 text-[0.72rem] transition duration-300 group-hover:translate-x-0.5"
                        style={{ color: accent.soft }}
                      >
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}

      {!loadError && !isHome ? (
        <div className="page-shell pt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow">
                {genre ? "Genre" : query ? "Search" : "Browse"}
              </p>
              <h2 className="section-title">{browseTitle}</h2>
            </div>
            <Link href="/manga" className="link-quiet text-sm">
              Back to shelves →
            </Link>
          </div>

          {!query ? (
            <div className="filter-rail mt-6" role="tablist" aria-label="Sort">
              {(
                [
                  { id: "popular", label: "Popular" },
                  { id: "trending", label: "Trending" },
                  { id: "latest", label: "Latest" },
                  { id: "rating", label: "Top rated" },
                ] as const
              )
                .filter((s) => !(genre && s.id === "trending"))
                .map((s) => {
                  const active = sort === s.id;
                  const href = genre
                    ? `/manga?genre=${genre.slug}&sort=${s.id}`
                    : `/manga?sort=${s.id}`;
                  return (
                    <Link
                      key={s.id}
                      href={href}
                      role="tab"
                      aria-selected={active}
                      className={`filter-pill ${active ? "is-active" : ""}`}
                    >
                      {s.label}
                    </Link>
                  );
                })}
            </div>
          ) : null}

          {(query ? searchItems : shelfItems).length === 0 ? (
            <p className="mt-10 text-mute">No titles matched.</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {(query ? searchItems : shelfItems).map((manga, i) => (
                <MangaPoster key={manga.id} manga={manga} index={i} />
              ))}
            </div>
          )}

          <PagePagination
            page={Math.min(page, totalPages)}
            totalPages={totalPages}
            hrefForPage={(p) => {
              const qs = new URLSearchParams({ page: String(p) });
              if (query) qs.set("q", query);
              if (genre) qs.set("genre", genre.slug);
              else if (params.sort) qs.set("sort", sort);
              return `/manga?${qs}`;
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
