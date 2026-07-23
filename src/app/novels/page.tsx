import { NovelPoster } from "@/components/novels/novel-poster";
import { NovelRow } from "@/components/novels/novel-row";
import { PagePagination } from "@/components/page-pagination";
import {
  getChineseNovels,
  getJapaneseNovels,
  getKoreanNovels,
  searchNovels,
  type NovelOrigin,
} from "@/lib/novelbuddy";
import type { NovelListItem } from "@/lib/novel-types";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ShelfTab = "japanese" | "korean" | "chinese";

type Props = {
  searchParams: Promise<{
    type?: string;
    page?: string;
    q?: string;
  }>;
};

function parseTab(raw: string | undefined): ShelfTab | "home" {
  if (raw === "japanese" || raw === "korean" || raw === "chinese") return raw;
  return "home";
}

function tabLabel(tab: ShelfTab) {
  if (tab === "korean") return "Korean";
  if (tab === "chinese") return "Chinese";
  return "Japanese";
}

export default async function NovelsPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = parseTab(params.type);
  const page = Math.max(1, Number(params.page || 1));
  const query = (params.q || "").trim();

  let popular: NovelListItem[] = [];
  let japanese: NovelListItem[] = [];
  let korean: NovelListItem[] = [];
  let chinese: NovelListItem[] = [];
  let shelfItems: NovelListItem[] = [];
  let searchItems: NovelListItem[] = [];
  let searchFound = 0;
  let totalPages = 1;
  let loadError: string | null = null;

  try {
    if (query) {
      const origin: NovelOrigin | "all" =
        tab === "home" ? "all" : tab;
      // Prefer JP when browsing all — search each origin and merge
      if (origin === "all") {
        const [jp, kr, cn] = await Promise.all([
          searchNovels(query, page, 24, undefined, "japanese"),
          searchNovels(query, 1, 12, undefined, "korean"),
          searchNovels(query, 1, 12, undefined, "chinese"),
        ]);
        const map = new Map<string, NovelListItem>();
        for (const item of [...jp.items, ...kr.items, ...cn.items]) {
          map.set(item.id, item);
        }
        searchItems = [...map.values()];
        searchFound = jp.total + kr.total + cn.total;
        totalPages = Math.max(1, jp.totalPages);
      } else {
        const result = await searchNovels(query, page, 48, undefined, origin);
        searchItems = result.items;
        searchFound = result.total;
        totalPages = Math.max(1, result.totalPages);
      }
    } else if (tab === "home") {
      const [jp, kr, cn] = await Promise.all([
        getJapaneseNovels(1, 24),
        getKoreanNovels(1, 24),
        getChineseNovels(1, 24),
      ]);
      japanese = jp.items;
      korean = kr.items;
      chinese = cn.items;
      // JP first on the popular rail, then fill with the best KR/CN.
      const rest = [...korean, ...chinese]
        .sort((a, b) => (b.views || 0) - (a.views || 0));
      const map = new Map<string, NovelListItem>();
      for (const item of [
        ...japanese.slice(0, 12),
        ...rest,
        ...japanese.slice(12),
      ]) {
        map.set(item.id, item);
      }
      popular = [...map.values()].slice(0, 18);
    } else if (tab === "japanese") {
      const result = await getJapaneseNovels(page, 48);
      shelfItems = result.items;
      totalPages = Math.max(page, result.totalPages);
    } else if (tab === "korean") {
      const result = await getKoreanNovels(page, 48);
      shelfItems = result.items;
      totalPages = Math.max(page, result.totalPages);
    } else {
      const result = await getChineseNovels(page, 48);
      shelfItems = result.items;
      totalPages = Math.max(page, result.totalPages);
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load novels";
  }

  const tabs: { id: "home" | ShelfTab; label: string; href: string }[] = [
    { id: "home", label: "For you", href: "/novels" },
    { id: "japanese", label: "Japanese", href: "/novels?type=japanese" },
    { id: "korean", label: "Korean", href: "/novels?type=korean" },
    { id: "chinese", label: "Chinese", href: "/novels?type=chinese" },
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
        Novels
      </h1>
      <p className="mt-3 max-w-xl text-cloud">
        Japanese light novels first — then Korean and Chinese titles that fit
        the anime shelf. No random romance spam.
      </p>

      <form action="/novels" method="get" className="mt-8 max-w-xl">
        {tab !== "home" ? (
          <input type="hidden" name="type" value={tab} />
        ) : null}
        <label className="sr-only" htmlFor="novel-search">
          Search novels
        </label>
        <div className="flex gap-2">
          <input
            id="novel-search"
            name="q"
            defaultValue={query}
            placeholder="Search light novels…"
            className="h-12 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm text-snow outline-none placeholder:text-mute focus:border-sakura/40"
          />
          <button type="submit" className="btn-primary shrink-0 !px-5">
            Search
          </button>
        </div>
      </form>

      <div className="filter-rail mt-8" role="tablist" aria-label="Novel origin">
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
                Results for “{query}”
                {tab !== "home" ? ` · ${tabLabel(tab)}` : ""}
              </h2>
            </div>
            <Link
              href={tab === "home" ? "/novels" : `/novels?type=${tab}`}
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
            hrefForPage={(p) => {
              const qs = new URLSearchParams({
                q: query,
                page: String(p),
              });
              if (tab !== "home") qs.set("type", tab);
              return `/novels?${qs}`;
            }}
          />
        </>
      ) : null}

      {!loadError && !query && tab === "home" ? (
        <>
          <NovelRow
            eyebrow="Tonight"
            title="Popular on the shelf"
            subtitle="Anime-adjacent light novels worth opening"
            items={popular}
            seeAllHref="/novels?type=japanese"
          />
          <NovelRow
            eyebrow="Japan"
            title="Japanese light novels"
            subtitle="The main room — isekai, academy, long nights"
            items={japanese}
            seeAllHref="/novels?type=japanese"
          />

          <div className="mt-16 border-t border-white/[0.06] pt-2">
            <NovelRow
              eyebrow="Korea"
              title="Korean novels"
              subtitle="Manhwa-world stories that still feel otaku"
              items={korean}
              seeAllHref="/novels?type=korean"
            />
            <NovelRow
              eyebrow="China"
              title="Chinese novels"
              subtitle="Xianxia roads and long cultivation arcs"
              items={chinese}
              seeAllHref="/novels?type=chinese"
            />
          </div>
        </>
      ) : null}

      {!loadError && !query && tab !== "home" ? (
        <>
          <div className="mt-6">
            <p className="section-eyebrow">{tabLabel(tab)}</p>
            <h2 className="section-title">Browse the shelf</h2>
          </div>

          {shelfItems.length === 0 ? (
            <p className="mt-10 text-mute">Nothing passed the anime filter here.</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {shelfItems.map((novel, i) => (
                <NovelPoster key={novel.id} novel={novel} index={i} />
              ))}
            </div>
          )}

          <PagePagination
            page={page}
            totalPages={Math.max(page, totalPages)}
            hrefForPage={(p) => `/novels?type=${tab}&page=${p}`}
          />
        </>
      ) : null}
    </div>
  );
}
