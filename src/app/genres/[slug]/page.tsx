import { AnimePoster } from "@/components/anime-poster";
import { MoodHero } from "@/components/mood-hero";
import { slugifyGenre } from "@/lib/anikoto";
import { getCatalog, getGenreStats } from "@/lib/catalog";
import { moodArt, pickGenreCovers } from "@/lib/genre-moods";
import { fetchMoodArtOverrides } from "@/lib/mood-art";
import type { CatalogAnime } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 180;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
};

const SORTS = [
  { id: "score", label: "Top rated" },
  { id: "year", label: "Newest" },
  { id: "title", label: "A–Z" },
  { id: "recent", label: "Catalog" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

function sortAnime(list: CatalogAnime[], sort: SortId) {
  const next = [...list];
  if (sort === "score") {
    next.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  } else if (sort === "title") {
    next.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "year") {
    next.sort((a, b) => (b.year || 0) - (a.year || 0));
  }
  return next;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const genres = await getGenreStats();
  const genre = genres.find((g) => g.slug === slug);
  const name = genre?.name ?? slug.replace(/-/g, " ");
  return {
    title: `${name} · Moods`,
    description: `Browse ${name} anime on Anikura — a cinematic mood shelf.`,
  };
}

export default async function GenreDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sort: sortParam } = await searchParams;
  const sort: SortId = SORTS.some((s) => s.id === sortParam)
    ? (sortParam as SortId)
    : "score";

  const [genres, catalog, moodOverrides] = await Promise.all([
    getGenreStats(),
    getCatalog(),
    fetchMoodArtOverrides(),
  ]);

  const genre = genres.find((g) => g.slug === slug);
  const filtered = catalog.filter((anime) =>
    anime.genres.some((g) => slugifyGenre(g) === slug),
  );

  if (!genre && filtered.length === 0) notFound();

  const name = genre?.name ?? slug.replace(/-/g, " ");
  const total = filtered.length;
  const sorted = sortAnime(filtered, sort);
  const DISPLAY_LIMIT = 120;
  const anime = sorted.slice(0, DISPLAY_LIMIT);

  const curated = moodArt(slug, moodOverrides);
  const cover =
    curated ??
    pickGenreCovers(
      catalog,
      [{ name, slug, count: total }],
      moodOverrides,
    ).get(slug);

  const scored = anime.filter((a) => Number(a.score) > 0);
  const avgScore = scored.length
    ? scored.reduce((sum, a) => sum + Number(a.score), 0) / scored.length
    : 0;

  return (
    <div className="page-enter relative pb-24">
      <MoodHero
        name={name}
        slug={slug}
        count={total}
        coverSrc={cover?.src}
        coverPosition={cover?.position}
        credit={curated?.credit || undefined}
      />

      <div className="page-shell relative pt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-64"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, rgba(255,140,170,0.1), transparent 70%)`,
          }}
        />

        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-5">
          {SORTS.map((s) => {
            const active = s.id === sort;
            return (
              <Link
                key={s.id}
                href={
                  s.id === "score"
                    ? `/genres/${slug}`
                    : `/genres/${slug}?sort=${s.id}`
                }
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-sakura text-[#1a1014] shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                    : "border border-white/12 text-cloud hover:border-white/25 hover:text-snow"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
          <p className="ml-auto text-sm text-mute">
            {scored.length > 0 && sort === "score"
              ? `Avg ${avgScore.toFixed(1)} · `
              : null}
            {anime.length.toLocaleString()}
            {total > DISPLAY_LIMIT
              ? ` of ${total.toLocaleString()}`
              : ""}{" "}
            shown
          </p>
        </div>

        {anime.length === 0 ? (
          <p className="mt-16 text-center text-mute">
            No titles in this mood yet.
          </p>
        ) : (
          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {anime.map((item, i) => (
              <article
                key={item.id}
                className="mood-film-card group relative"
                style={{ animationDelay: `${Math.min(i, 16) * 30}ms` }}
              >
                <AnimePoster anime={item} index={i} />
                {item.year ? (
                  <div className="mt-2 px-0.5">
                    <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[0.65rem] font-medium tabular-nums text-cloud">
                      {item.year}
                    </span>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}

        {total > DISPLAY_LIMIT ? (
          <p className="mt-10 text-center text-sm text-mute">
            Showing the top {DISPLAY_LIMIT.toLocaleString()} by this sort —
            refine with the filters above.
          </p>
        ) : null}
      </div>
    </div>
  );
}
