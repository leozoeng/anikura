import { AnimePoster } from "@/components/anime-poster";
import { getByGenre, getCatalog, getGenreStats } from "@/lib/catalog";
import { genreWash, moodArt, pickGenreCovers } from "@/lib/genre-moods";
import { fetchMoodArtOverrides } from "@/lib/mood-art";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function GenreDetailPage({ params }: Props) {
  const { slug } = await params;
  const [genres, result, catalog, moodOverrides] = await Promise.all([
    getGenreStats(),
    getByGenre(slug, 96),
    getCatalog(),
    fetchMoodArtOverrides(),
  ]);

  const genre = genres.find((g) => g.slug === slug);
  if (!genre && result.total === 0) notFound();

  const name = genre?.name ?? slug.replace(/-/g, " ");
  const curated = moodArt(slug, moodOverrides);
  const cover =
    curated ??
    pickGenreCovers(
      catalog,
      [{ name, slug, count: result.total }],
      moodOverrides,
    ).get(slug);

  return (
    <div className="page-enter relative pb-16">
      <header className="relative overflow-hidden border-b border-white/[0.06]">
        {cover ? (
          <div aria-hidden className="absolute inset-0">
            <Image
              src={cover.src}
              alt=""
              fill
              priority
              sizes="100vw"
              className={`scale-110 object-cover opacity-40 blur-2xl ${cover.position ?? "object-center"}`}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.88) 70%, #000 100%),
                  linear-gradient(120deg, ${genreWash(slug)} 0%, transparent 50%)
                `,
              }}
            />
          </div>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `radial-gradient(700px 320px at 15% 20%, ${genreWash(slug)}, transparent 65%)`,
            }}
          />
        )}

        <div className="relative mx-auto max-w-[1200px] px-5 pb-12 pt-28 sm:px-8">
          <Link
            href="/genres"
            className="link-quiet mt-6 inline-flex items-center gap-2 text-sm"
          >
            ← All moods
          </Link>
          <h1 className="mt-3 text-[clamp(2.4rem,6vw,4rem)] font-semibold capitalize tracking-[-0.05em] text-snow">
            {name}
          </h1>
          <p className="mt-3 text-cloud">
            {result.total.toLocaleString()} titles in this mood
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-5 pt-12 sm:px-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {result.anime.map((anime, i) => (
            <AnimePoster key={anime.id} anime={anime} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
