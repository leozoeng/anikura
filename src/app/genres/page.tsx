import Link from "next/link";
import { getGenreStats, getSyncMeta } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function GenresPage() {
  const [genres, meta] = await Promise.all([getGenreStats(), getSyncMeta()]);

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-28 sm:px-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-mute uppercase">
        <span className="sakura-dot h-1.5 w-1.5 rounded-full bg-sakura" />
        Moods
      </div>
      <h1 className="mt-5 text-[clamp(2.4rem,6vw,4rem)] font-semibold tracking-[-0.05em]">
        Genres
      </h1>
      <p className="mt-3 max-w-xl text-cloud">
        {meta
          ? `Pick a mood from ${meta.totalAnime.toLocaleString()} indexed titles`
          : "Sync the catalog to unlock genre browsing"}
      </p>

      {genres.length === 0 ? (
        <p className="mt-16 text-mute">
          No genres yet. Run <code className="text-snow">npm run sync</code>.
        </p>
      ) : (
        <div className="mt-12 divide-y divide-white/8 border-y border-white/8">
          {genres.map((genre) => (
            <Link
              key={genre.slug}
              href={`/genres/${genre.slug}`}
              className="group flex items-baseline justify-between gap-6 py-5 transition duration-300 hover:bg-[#ff8caa]/05"
            >
              <span className="text-[clamp(1.25rem,3vw,1.75rem)] font-medium tracking-[-0.03em] transition duration-300 group-hover:translate-x-1 group-hover:text-sakura-soft">
                {genre.name}
              </span>
              <span className="shrink-0 text-sm text-mute">
                {genre.count.toLocaleString()}
                <span className="ml-3 text-cloud transition group-hover:text-sakura-soft">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
