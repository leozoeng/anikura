import { MangaPoster } from "@/components/manga/manga-poster";
import { MangaRow } from "@/components/manga/manga-row";
import { PagePagination } from "@/components/page-pagination";
import {
  getRecentlyUpdatedManga,
  getTrendingManga,
  searchManga,
} from "@/lib/atsu";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    sort?: string;
    page?: string;
    q?: string;
  }>;
};

export default async function MangaPage({ searchParams }: Props) {
  const params = await searchParams;
  const sort = params.sort === "updated" ? "updated" : "trending";
  const page = Math.max(1, Number(params.page || 1));
  const query = (params.q || "").trim();
  const apiPage = page - 1;

  let trending = [] as Awaited<ReturnType<typeof getTrendingManga>>;
  let updated = [] as Awaited<ReturnType<typeof getRecentlyUpdatedManga>>;
  let searchItems = [] as Awaited<ReturnType<typeof searchManga>>["items"];
  let searchFound = 0;
  let loadError: string | null = null;

  try {
    if (query) {
      const result = await searchManga(query, page, 48);
      searchItems = result.items;
      searchFound = result.found;
    } else if (page === 1) {
      [trending, updated] = await Promise.all([
        getTrendingManga(0),
        getRecentlyUpdatedManga(0),
      ]);
    } else if (sort === "updated") {
      updated = await getRecentlyUpdatedManga(apiPage);
    } else {
      trending = await getTrendingManga(apiPage);
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load manga";
  }

  const gridItems = query
    ? searchItems
    : page === 1
      ? []
      : sort === "updated"
        ? updated
        : trending;

  const totalPages = query
    ? Math.max(1, Math.ceil(searchFound / 48))
    : page === 1
      ? 1
      : page + (gridItems.length >= 24 ? 1 : 0);

  const sorts = [
    { id: "trending", label: "Trending" },
    { id: "updated", label: "Latest" },
  ] as const;

  return (
    <div className="page-shell page-enter relative pb-16 pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
      >
        <div className="absolute left-[-8%] top-8 h-48 w-[42%] rounded-full bg-[radial-gradient(circle,rgba(255,140,170,0.12),transparent_68%)] blur-3xl" />
        <div className="absolute right-[-6%] top-16 h-40 w-[36%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.04),transparent_70%)] blur-3xl" />
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-mute uppercase">
        <span className="sakura-dot h-1.5 w-1.5 rounded-full bg-sakura" />
        Library
      </div>
      <h1 className="mt-5 text-[clamp(2.4rem,6vw,4rem)] font-semibold tracking-[-0.05em] text-snow">
        Manga
      </h1>
      <p className="mt-3 max-w-xl text-cloud">
        Quiet shelves for loud panels — manga, manhwa, and manhua in the same
        Anikura night.
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

      {loadError ? (
        <div className="mt-16 border border-dashed border-white/15 px-8 py-14 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">
            Couldn&apos;t reach the library
          </h2>
          <p className="mx-auto mt-3 max-w-md text-mute">{loadError}</p>
        </div>
      ) : null}

      {!loadError && query ? (
        <>
          <div className="mt-10 flex items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow">Search</p>
              <h2 className="section-title">
                {searchFound.toLocaleString()} results for “{query}”
              </h2>
            </div>
            <Link href="/manga" className="text-sm text-mute hover:text-sakura-soft">
              Clear
            </Link>
          </div>
          {searchItems.length === 0 ? (
            <p className="mt-10 text-mute">No titles matched that search.</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {searchItems.map((manga, i) => (
                <MangaPoster key={manga.id} manga={manga} index={i} />
              ))}
            </div>
          )}
          <PagePagination
            page={Math.min(page, totalPages)}
            totalPages={totalPages}
            hrefForPage={(p) => `/manga?q=${encodeURIComponent(query)}&page=${p}`}
          />
        </>
      ) : null}

      {!loadError && !query && page === 1 ? (
        <>
          <MangaRow
            eyebrow="Right now"
            title="Trending"
            subtitle="What the shelf is warming up tonight"
            items={trending.slice(0, 18)}
            seeAllHref="/manga?sort=trending&page=2"
          />
          <MangaRow
            eyebrow="Fresh ink"
            title="Latest updates"
            subtitle="New chapters as they land"
            items={updated.slice(0, 18)}
            seeAllHref="/manga?sort=updated&page=2"
          />
          <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {trending.slice(0, 24).map((manga, i) => (
              <MangaPoster key={`grid-${manga.id}`} manga={manga} index={i} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href="/manga?sort=trending&page=2" className="btn-ghost">
              Browse more
            </Link>
          </div>
        </>
      ) : null}

      {!loadError && !query && page > 1 ? (
        <>
          <div
            className="filter-rail mt-9"
            role="tablist"
            aria-label="Manga sort"
          >
            {sorts.map((s) => {
              const active = sort === s.id;
              return (
                <Link
                  key={s.id}
                  href={`/manga?sort=${s.id}&page=1`}
                  role="tab"
                  aria-selected={active}
                  className={`filter-pill ${active ? "is-active" : ""}`}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {gridItems.map((manga, i) => (
              <MangaPoster key={manga.id} manga={manga} index={i} />
            ))}
          </div>

          <PagePagination
            page={page}
            totalPages={Math.max(page, totalPages)}
            hrefForPage={(p) => `/manga?sort=${sort}&page=${p}`}
          />
        </>
      ) : null}
    </div>
  );
}
