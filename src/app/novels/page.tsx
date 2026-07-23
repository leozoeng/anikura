import { NovelPoster } from "@/components/novels/novel-poster";
import { NovelRow } from "@/components/novels/novel-row";
import { PagePagination } from "@/components/page-pagination";
import {
  getLatestNovels,
  getPopularNovels,
  searchNovels,
} from "@/lib/novelbuddy";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    sort?: string;
    page?: string;
    q?: string;
  }>;
};

export default async function NovelsPage({ searchParams }: Props) {
  const params = await searchParams;
  const sort = params.sort === "latest" ? "latest" : "popular";
  const page = Math.max(1, Number(params.page || 1));
  const query = (params.q || "").trim();

  let popular = [] as Awaited<ReturnType<typeof getPopularNovels>>;
  let latest = [] as Awaited<ReturnType<typeof getLatestNovels>>["items"];
  let searchItems = [] as Awaited<ReturnType<typeof searchNovels>>["items"];
  let searchFound = 0;
  let totalPages = 1;
  let loadError: string | null = null;

  try {
    if (query) {
      const result = await searchNovels(query, page, 48);
      searchItems = result.items;
      searchFound = result.total;
      totalPages = Math.max(1, result.totalPages);
    } else if (page === 1) {
      const [pop, lat] = await Promise.all([
        getPopularNovels(24),
        getLatestNovels(1, 24),
      ]);
      popular = pop;
      latest = lat.items;
    } else if (sort === "latest") {
      const result = await getLatestNovels(page, 48);
      latest = result.items;
      totalPages = Math.max(page, result.totalPages);
    } else {
      popular = await getPopularNovels(48);
      totalPages = 1;
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load novels";
  }

  const sorts = [
    { id: "popular", label: "Popular" },
    { id: "latest", label: "Latest" },
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
        Novels
      </h1>
      <p className="mt-3 max-w-xl text-cloud">
        Light novels and web novels for the nights that want words instead of
        frames — same quiet Anikura shelf.
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

      {loadError ? (
        <div className="mt-16 border border-dashed border-white/15 px-8 py-14 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">
            Couldn&apos;t reach the shelf
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
            <Link
              href="/novels"
              className="text-sm text-mute hover:text-sakura-soft"
            >
              Clear
            </Link>
          </div>
          {searchItems.length === 0 ? (
            <p className="mt-10 text-mute">No titles matched that search.</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {searchItems.map((novel, i) => (
                <NovelPoster key={novel.id} novel={novel} index={i} />
              ))}
            </div>
          )}
          <PagePagination
            page={Math.min(page, totalPages)}
            totalPages={totalPages}
            hrefForPage={(p) =>
              `/novels?q=${encodeURIComponent(query)}&page=${p}`
            }
          />
        </>
      ) : null}

      {!loadError && !query && page === 1 ? (
        <>
          <NovelRow
            eyebrow="Tonight’s shelf"
            title="Popular"
            subtitle="Titles the room keeps opening"
            items={popular.slice(0, 18)}
            seeAllHref="/novels?sort=popular&page=2"
          />
          <NovelRow
            eyebrow="Fresh ink"
            title="Latest updates"
            subtitle="New chapters landing on the shelf"
            items={latest.slice(0, 18)}
            seeAllHref="/novels?sort=latest&page=2"
          />
          <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {popular.slice(0, 24).map((novel, i) => (
              <NovelPoster key={`grid-${novel.id}`} novel={novel} index={i} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href="/novels?sort=latest&page=2" className="btn-ghost">
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
            aria-label="Novel sort"
          >
            {sorts.map((s) => {
              const active = sort === s.id;
              return (
                <Link
                  key={s.id}
                  href={`/novels?sort=${s.id}&page=1`}
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
            {(sort === "latest" ? latest : popular).map((novel, i) => (
              <NovelPoster key={novel.id} novel={novel} index={i} />
            ))}
          </div>

          {sort === "latest" ? (
            <PagePagination
              page={page}
              totalPages={Math.max(page, totalPages)}
              hrefForPage={(p) => `/novels?sort=latest&page=${p}`}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
