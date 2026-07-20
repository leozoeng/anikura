import { AnimePoster } from "@/components/anime-poster";
import { getGenres, getRecentAnime } from "@/lib/anikoto";
import { searchCatalog } from "@/lib/catalog";
import type { AnimeSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  let results: AnimeSummary[] = [];

  if (query) {
    const local = await searchCatalog(query, 48);
    if (local.length) {
      results = local;
    } else {
      const { anime } = await getRecentAnime(1, 50);
      const needle = query.toLowerCase();
      results = anime.filter((a) => {
        const hay = [a.title, a.alternative, a.native, ...getGenres(a)]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-28 sm:px-8">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-mute">
        Search
      </p>
      <h1 className="mt-3 text-[clamp(2.4rem,6vw,4rem)] font-semibold tracking-[-0.05em]">
        {query || "Find a title"}
      </h1>
      <p className="mt-3 text-cloud">
        {query
          ? `${results.length} result${results.length === 1 ? "" : "s"}`
          : "Use the search icon in the header"}
      </p>

      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {results.map((anime) => (
          <AnimePoster key={anime.id} anime={anime} />
        ))}
      </div>
    </div>
  );
}
