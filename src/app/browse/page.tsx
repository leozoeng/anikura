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
    <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-28 sm:px-8">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-mute">
        Library
      </p>
      <h1 className="mt-3 text-[clamp(2.4rem,6vw,4rem)] font-semibold tracking-[-0.05em] text-snow">
        Browse
      </h1>
      <p className="mt-3 max-w-xl text-cloud">
        {meta
          ? `${meta.totalAnime.toLocaleString()} titles · updated ${new Date(meta.syncedAt).toLocaleDateString()}`
          : "Run a catalog sync to fill this shelf."}
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {sorts.map((s) => (
          <Link
            key={s.id}
            href={`/browse?sort=${s.id}`}
            className={`rounded-full px-4 py-2 text-sm tracking-[-0.01em] transition ${
              sort === s.id
                ? "bg-snow text-void"
                : "border border-white/12 text-cloud hover:border-white/30 hover:text-snow"
            }`}
          >
            {s.label}
          </Link>
        ))}
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
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {slice.map((anime) => (
              <AnimePoster key={anime.id} anime={anime} />
            ))}
          </div>

          <div className="mt-14 flex items-center justify-center gap-4 text-sm">
            {page > 1 && (
              <Link
                href={`/browse?sort=${sort}&page=${page - 1}`}
                className="btn-ghost !py-2 !px-4 text-sm"
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
                className="btn-primary !py-2 !px-4 text-sm"
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
