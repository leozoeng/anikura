import { AnimePoster } from "@/components/anime-poster";
import { getByGenre, getGenreStats } from "@/lib/catalog";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function GenreDetailPage({ params }: Props) {
  const { slug } = await params;
  const [genres, result] = await Promise.all([
    getGenreStats(),
    getByGenre(slug, 96),
  ]);

  const genre = genres.find((g) => g.slug === slug);
  if (!genre && result.total === 0) notFound();

  const name = genre?.name ?? slug.replace(/-/g, " ");

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-28 sm:px-8">
      <Link href="/genres" className="link-quiet text-sm">
        ← Genres
      </Link>
      <h1 className="mt-5 text-[clamp(2.4rem,6vw,4rem)] font-semibold capitalize tracking-[-0.05em]">
        {name}
      </h1>
      <p className="mt-3 text-cloud">
        {result.total.toLocaleString()} titles
      </p>

      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {result.anime.map((anime) => (
          <AnimePoster key={anime.id} anime={anime} />
        ))}
      </div>
    </div>
  );
}
