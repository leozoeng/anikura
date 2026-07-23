import { MangaPoster } from "@/components/manga/manga-poster";
import { MangaRow } from "@/components/manga/manga-row";
import { PagePagination } from "@/components/page-pagination";
import {
  getRecentlyUpdatedManga,
  getTrendingManga,
  searchManga,
  type MangaShelfType,
} from "@/lib/atsu";
import type { MangaListItem } from "@/lib/manga-types";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ShelfTab = "manga" | "manhwa" | "manhua";

type Props = {
  searchParams: Promise<{
    type?: string;
    sort?: string;
    page?: string;
    q?: string;
  }>;
};

function parseTab(raw: string | undefined): ShelfTab | "home" {
  if (raw === "manhwa" || raw === "manhua" || raw === "manga") return raw;
  return "home";
}

function apiType(tab: ShelfTab): MangaShelfType {
  if (tab === "manhwa") return "Manwha";
  if (tab === "manhua") return "Manhua";
  return "Manga";
}

function tabLabel(tab: ShelfTab) {
  if (tab === "manhwa") return "Manhwa";
  if (tab === "manhua") return "Manhua";
  return "Manga";
}

export default async function MangaPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = parseTab(params.type);
  const sort = params.sort === "updated" ? "updated" : "trending";
  const page = Math.max(1, Number(params.page || 1));
  const query = (params.q || "").trim();
  const apiPage = page - 1;

  let trendingManga: MangaListItem[] = [];
  let latestManga: MangaListItem[] = [];
  let trendingManhwa: MangaListItem[] = [];
  let trendingManhua: MangaListItem[] = [];
  let shelfItems: MangaListItem[] = [];
  let searchItems: MangaListItem[] = [];
  let searchFound = 0;
  let loadError: string | null = null;

  try {
    if (query) {
      const typeFilter =
        tab === "home" ? "all" : apiType(tab);
      const result = await searchManga(query, page, 48, undefined, typeFilter);
      searchItems = result.items;
      searchFound = result.found;
    } else if (tab === "home") {
      const [tm, lm, thw, thu] = await Promise.all([
        getTrendingManga(0, "Manga"),
        getRecentlyUpdatedManga(0, "Manga"),
        getTrendingManga(0, "Manwha"),
        getTrendingManga(0, "Manhua"),
      ]);
      trendingManga = tm;
      latestManga = lm;
      trendingManhwa = thw;
      trendingManhua = thu;
    } else {
      const type = apiType(tab);
      shelfItems =
        sort === "updated"
          ? await getRecentlyUpdatedManga(apiPage, type)
          : await getTrendingManga(apiPage, type);
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load manga";
  }

  const totalPages = query
    ? Math.max(1, Math.ceil(searchFound / 48))
    : tab === "home"
      ? 1
      : page + (shelfItems.length >= 24 ? 1 : 0);

  const tabs: { id: "home" | ShelfTab; label: string; href: string }[] = [
    { id: "home", label: "For you", href: "/manga" },
    { id: "manga", label: "Manga", href: "/manga?type=manga" },
    { id: "manhwa", label: "Manhwa", href: "/manga?type=manhwa" },
    { id: "manhua", label: "Manhua", href: "/manga?type=manhua" },
  ];

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
        Japanese manga first — then manhwa and manhua on their own shelves.
      </p>

      <form action="/manga" method="get" className="mt-8 max-w-xl">
        {tab !== "home" ? (
          <input type="hidden" name="type" value={tab} />
        ) : null}
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

      <div className="filter-rail mt-8" role="tablist" aria-label="Manga type">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <Link
              key={t.id}
              href={t.href}
              role="tab"
              aria-selected={active}
              className={`filter-pill ${active ? "is-active" : ""}`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

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
                Results for “{query}”
                {tab !== "home" ? ` · ${tabLabel(tab)}` : ""}
              </h2>
            </div>
            <Link
              href={tab === "home" ? "/manga" : `/manga?type=${tab}`}
              className="text-sm text-mute hover:text-sakura-soft"
            >
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
            hrefForPage={(p) => {
              const qs = new URLSearchParams({
                q: query,
                page: String(p),
              });
              if (tab !== "home") qs.set("type", tab);
              return `/manga?${qs}`;
            }}
          />
        </>
      ) : null}

      {!loadError && !query && tab === "home" ? (
        <>
          <MangaRow
            eyebrow="Japan"
            title="Trending manga"
            subtitle="The main shelf — Japanese titles first"
            items={trendingManga.slice(0, 18)}
            seeAllHref="/manga?type=manga"
          />
          <MangaRow
            eyebrow="Fresh ink"
            title="Latest manga"
            subtitle="New chapters from the Japanese shelf"
            items={latestManga.slice(0, 18)}
            seeAllHref="/manga?type=manga&sort=updated"
          />

          <div className="mt-16 border-t border-white/[0.06] pt-2">
            <MangaRow
              eyebrow="Korea"
              title="Manhwa"
              subtitle="Webtoon energy on its own row"
              items={trendingManhwa.slice(0, 18)}
              seeAllHref="/manga?type=manhwa"
            />
            <MangaRow
              eyebrow="China"
              title="Manhua"
              subtitle="Cultivation nights and long roads"
              items={trendingManhua.slice(0, 18)}
              seeAllHref="/manga?type=manhua"
            />
          </div>
        </>
      ) : null}

      {!loadError && !query && tab !== "home" ? (
        <>
          <div
            className="filter-rail mt-6"
            role="tablist"
            aria-label={`${tabLabel(tab)} sort`}
          >
            {(
              [
                { id: "trending", label: "Trending" },
                { id: "updated", label: "Latest" },
              ] as const
            ).map((s) => {
              const active = sort === s.id;
              return (
                <Link
                  key={s.id}
                  href={`/manga?type=${tab}&sort=${s.id}`}
                  role="tab"
                  aria-selected={active}
                  className={`filter-pill ${active ? "is-active" : ""}`}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-4">
            <p className="section-eyebrow">{tabLabel(tab)}</p>
            <h2 className="section-title">
              {sort === "updated" ? "Latest updates" : "Trending now"}
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {shelfItems.map((manga, i) => (
              <MangaPoster key={manga.id} manga={manga} index={i} />
            ))}
          </div>

          <PagePagination
            page={page}
            totalPages={Math.max(page, totalPages)}
            hrefForPage={(p) =>
              `/manga?type=${tab}&sort=${sort}&page=${p}`
            }
          />
        </>
      ) : null}
    </div>
  );
}
