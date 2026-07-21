import { AnimePoster } from "@/components/anime-poster";
import { SearchPageForm } from "@/components/search-page-form";
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
    <div className="page-shell pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-24 sm:pb-24 sm:pt-28">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-mute">
        Search
      </p>
      <h1 className="mt-2 text-[clamp(1.85rem,7vw,4rem)] font-semibold tracking-[-0.05em]">
        {query || "Find a title"}
      </h1>
      <SearchPageForm initialQuery={query} />
      <p className="mt-3 text-sm text-cloud sm:text-base">
        {query
          ? `${results.length} result${results.length === 1 ? "" : "s"}`
          : "Type a title, studio, or vibe."}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-12 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {results.map((anime) => (
          <AnimePoster key={anime.id} anime={anime} />
        ))}
      </div>
    </div>
  );
}
