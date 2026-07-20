import { AnimePoster } from "@/components/anime-poster";
import { getCatalog, getSyncMeta } from "@/lib/catalog";
import type { CatalogAnime } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ sort?: string; page?: string }>;
};

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const sort = params.sort || "recent";
  const page = Math.max(1, Number(params.page || 1));
  const perPage = 48;

  const [catalog, meta] = await Promise.all([getCatalog(), getSyncMeta()]);

  let sorted: CatalogAnime[] = [...catalog];
  if (sort === "score") {
    sorted.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  } else if (sort === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "year") {
    sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const slice = sorted.slice((page - 1) * perPage, page * perPage);

  const sorts = [
    { id: "recent", label: "For you" },
    { id: "score", label: "Top rated" },
    { id: "year", label: "Newest" },
    { id: "title", label: "A–Z" },
  ];

  return (
    <div className="page-enter relative mx-auto max-w-[1200px] px-5 pb-16 pt-28 sm:px-8">
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
        Browse
      </h1>
      <p className="mt-3 max-w-xl text-cloud">
        {meta
          ? `${meta.totalAnime.toLocaleString()} titles waiting for a quiet night · updated ${new Date(meta.syncedAt).toLocaleDateString()}`
          : "Run a catalog sync to fill this shelf."}
      </p>

      <div
        className="filter-rail mt-9"
        role="tablist"
        aria-label="Browse sort"
      >
        {sorts.map((s) => {
          const active = sort === s.id;
          return (
            <Link
              key={s.id}
              href={`/browse?sort=${s.id}`}
              role="tab"
              aria-selected={active}
              className={`filter-pill ${active ? "is-active" : ""}`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {slice.length === 0 ? (
        <div className="mt-20 border border-dashed border-white/15 px-8 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">
            Nothing here yet
          </h2>
          <p className="mx-auto mt-3 max-w-md text-mute">
            Sync titles from Anikoto into your local library.
          </p>
          <pre className="mx-auto mt-6 inline-block rounded-xl bg-elevated px-4 py-3 text-left text-sm text-cloud">
            npm run sync -- --pages=20
          </pre>
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {slice.map((anime, i) => (
              <AnimePoster key={anime.id} anime={anime} index={i} />
            ))}
          </div>

          <div className="mt-14 flex items-center justify-center gap-4 text-sm">
            {page > 1 && (
              <Link
                href={`/browse?sort=${sort}&page=${page - 1}`}
                className="btn-ghost !px-4 !py-2 text-sm"
              >
                Previous
              </Link>
            )}
            <span className="text-mute">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/browse?sort=${sort}&page=${page + 1}`}
                className="btn-primary !px-4 !py-2 text-sm"
              >
                Next
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
