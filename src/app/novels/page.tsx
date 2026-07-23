import { SafeImage } from "@/components/safe-image";
import { NovelPoster } from "@/components/novels/novel-poster";
import { NovelRow } from "@/components/novels/novel-row";
import { PagePagination } from "@/components/page-pagination";
import { genreWash, moodAccent } from "@/lib/genre-moods";
import {
  NOVEL_SHELF_GENRES,
  getJapaneseNovels,
  getLatestNovels,
  getNovelsByGenre,
  getPopularNovels,
  novelGenreBySlug,
  searchNovels,
  type NovelBrowseSort,
} from "@/lib/novelbuddy";
import type { NovelListItem } from "@/lib/novel-types";
import Link from "next/link";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    sort?: string;
    page?: string;
    q?: string;
    genre?: string;
  }>;
};

function parseSort(raw: string | undefined): NovelBrowseSort {
  if (raw === "latest") return "latest";
  return "popular";
}

function sortLabel(sort: NovelBrowseSort) {
  return sort === "latest" ? "Latest" : "Most popular";
}

/** Prefer distinct art per genre tile — avoid the same mega-hit on every mood. */
function pickUniqueGenreCovers(pools: NovelListItem[][]) {
  const used = new Set<string>();
  const out = new Map<string, string | null>();

  NOVEL_SHELF_GENRES.forEach((g, i) => {
    const pool = pools[i] || [];
    const pick =
      pool.find((item) => item.cover && !used.has(item.cover))?.cover ??
      pool.find((item) => item.cover)?.cover ??
      null;
    if (pick) used.add(pick);
    out.set(g.slug, pick);
  });

  return out;
}

function genrePool(slug: string, pools: NovelListItem[][]) {
  const idx = NOVEL_SHELF_GENRES.findIndex((g) => g.slug === slug);
  return idx >= 0 ? (pools[idx] || []).slice(0, 18) : [];
}

export default async function NovelsPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const genre = novelGenreBySlug(params.genre);
  const sort = parseSort(params.sort);
  const page = Math.max(1, Number(params.page || 1));
  const isHome = !query && !genre && !params.sort;

  let popular: NovelListItem[] = [];
  let latest: NovelListItem[] = [];
  let fantasy: NovelListItem[] = [];
  let action: NovelListItem[] = [];
  let comedy: NovelListItem[] = [];
  let genreCovers = new Map<string, string | null>();
  let shelfItems: NovelListItem[] = [];
  let searchItems: NovelListItem[] = [];
  let totalPages = 1;
  let loadError: string | null = null;

  try {
    if (query) {
      const result = await searchNovels(query, page, 48, undefined, "japanese");
      searchItems = result.items;
      totalPages = Math.max(1, result.totalPages);
    } else if (genre || params.sort) {
      const result = await getJapaneseNovels(page, 48, undefined, {
        genre: genre?.slug,
        sort,
      });
      shelfItems = result.items;
      totalPages = Math.max(page, result.totalPages);
    } else {
      const [popularItems, latestResult, ...pools] = await Promise.all([
        getPopularNovels(18),
        getLatestNovels(1, 18),
        ...NOVEL_SHELF_GENRES.map((g) => getNovelsByGenre(g.slug, 12)),
      ]);

      popular = popularItems;
      latest = latestResult.items;
      action = genrePool("action", pools);
      fantasy = genrePool("fantasy", pools);
      comedy = genrePool("comedy", pools);
      genreCovers = pickUniqueGenreCovers(pools);
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load novels";
  }

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
          Novels
        </h1>
        <p className="mt-3 max-w-xl text-cloud">
          Popular titles, fresh chapters, and genre shelves.
        </p>

        <form action="/novels" method="get" className="mt-8 max-w-xl">
          <label className="sr-only" htmlFor="novel-search">
            Search novels
          </label>
          <div className="flex gap-2">
            <input
              id="novel-search"
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
            Couldn&apos;t reach the shelf
          </h2>
          <p className="mx-auto mt-3 max-w-md text-mute">{loadError}</p>
        </div>
      ) : null}

      {!loadError && isHome ? (
        <div className="page-shell relative z-10 space-y-12 pt-10 sm:space-y-14">
          <NovelRow
            title="Trending now"
            subtitle="What people are reading"
            items={popular}
            seeAllHref="/novels?sort=popular"
            priorityCount={3}
          />
          <NovelRow
            title="Latest updates"
            subtitle="Fresh chapters dropping now"
            items={latest}
            seeAllHref="/novels?sort=latest"
          />
          <NovelRow
            title="Action"
            items={action}
            seeAllHref="/novels?genre=action"
          />
          <NovelRow
            title="Fantasy"
            items={fantasy}
            seeAllHref="/novels?genre=fantasy"
          />
          <NovelRow
            title="Comedy"
            items={comedy}
            seeAllHref="/novels?genre=comedy"
          />

          <section className="page-enter space-y-5">
            <div className="flex w-full items-end justify-between gap-4">
              <div>
                <h2 className="section-title">Genres</h2>
                <p className="section-sub">Pick a mood</p>
              </div>
            </div>
            <div className="fade-x scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-3.5">
              {NOVEL_SHELF_GENRES.map((g, i) => {
                const cover = genreCovers.get(g.slug);
                const accent = moodAccent(g.slug);
                const wash = genreWash(g.slug);
                return (
                  <Link
                    key={g.slug}
                    href={`/novels?genre=${g.slug}`}
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
            <Link href="/novels" className="link-quiet text-sm">
              Back to shelves →
            </Link>
          </div>

          {!query ? (
            <div className="filter-rail mt-6" role="tablist" aria-label="Sort">
              {(
                [
                  { id: "popular", label: "Popular" },
                  { id: "latest", label: "Latest" },
                ] as const
              ).map((s) => {
                const active = sort === s.id;
                const href = genre
                  ? `/novels?genre=${genre.slug}&sort=${s.id}`
                  : `/novels?sort=${s.id}`;
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
              {(query ? searchItems : shelfItems).map((novel, i) => (
                <NovelPoster key={novel.id} novel={novel} index={i} />
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
              if (params.sort || (!query && !genre)) qs.set("sort", sort);
              return `/novels?${qs}`;
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
