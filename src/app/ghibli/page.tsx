import Link from "next/link";
import { AnimePoster } from "@/components/anime-poster";
import { GhibliHero } from "@/components/ghibli-hero";
import { resolveAniListForAnime } from "@/lib/anilist";
import { getCatalog } from "@/lib/catalog";
import {
  getGhibliCollection,
  ghibliMiyazakiCount,
  type GhibliCatalogEntry,
} from "@/lib/ghibli";

export const metadata = {
  title: "Ghibli Selection",
  description:
    "Complete Studio Ghibli film collection on Anikura — Miyazaki and the Ghibli family.",
};

export const revalidate = 300;

type Props = {
  searchParams: Promise<{ view?: string }>;
};

const TRAILER_PRIORITY = [
  /spirited away/i,
  /howl'?s moving castle/i,
  /my neighbor totoro/i,
  /princess mononoke/i,
  /boy and the heron/i,
  /ponyo/i,
  /castle in the sky/i,
];

async function resolveHeroTrailer(entries: GhibliCatalogEntry[]) {
  for (const re of TRAILER_PRIORITY) {
    const entry = entries.find((e) => re.test(e.def.title));
    if (!entry) continue;
    const media = await resolveAniListForAnime(entry.anime);
    const trailer = media?.trailer;
    if (trailer?.site?.toLowerCase() === "youtube" && trailer.id) {
      return {
        trailerId: trailer.id,
        title: entry.def.title,
        poster:
          media?.bannerImage ||
          entry.anime.background_image ||
          entry.anime.poster,
      };
    }
  }

  const fallback = entries[0];
  return {
    trailerId: null as string | null,
    title: fallback?.def.title ?? "Studio Ghibli",
    poster:
      fallback?.anime.background_image ||
      fallback?.anime.poster ||
      "/anikura-mark.png",
  };
}

export default async function GhibliPage({ searchParams }: Props) {
  const { view } = await searchParams;
  const miyazakiOnly = view === "miyazaki";

  const catalog = await getCatalog();
  const all = getGhibliCollection(catalog);
  const entries = miyazakiOnly
    ? all.filter((e) => e.def.miyazaki)
    : all;
  const miyazakiCount = ghibliMiyazakiCount(all);
  const hero = await resolveHeroTrailer(all);

  return (
    <div className="page-enter relative pb-24">
      <GhibliHero
        trailerId={hero.trailerId}
        posterSrc={hero.poster}
        title={hero.title}
        filmCount={all.length}
        miyazakiCount={miyazakiCount}
      />

      <div className="page-shell relative pt-10">
        {/* Soft ground wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-64"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(168,210,170,0.12), transparent 70%)",
          }}
        />

        <div className="flex flex-wrap items-center gap-2 border-b border-[#c5d4b8]/12 pb-5">
          <Link
            href="/ghibli"
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              !miyazakiOnly
                ? "bg-[#e8f0dc] text-[#1a2618] shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                : "border border-[#c5d4b8]/20 text-[#b0c0a8] hover:border-[#c5d4b8]/40 hover:text-[#f3f0e6]"
            }`}
          >
            All films
          </Link>
          <Link
            href="/ghibli?view=miyazaki"
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              miyazakiOnly
                ? "bg-[#e8f0dc] text-[#1a2618] shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                : "border border-[#c5d4b8]/20 text-[#b0c0a8] hover:border-[#c5d4b8]/40 hover:text-[#f3f0e6]"
            }`}
          >
            Miyazaki only
          </Link>
          <p className="ml-auto text-sm text-[#8fa888]">
            Chronological · {entries.length} shown
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="mt-16 text-center text-[#8fa888]">
            No Ghibli titles found in the catalog yet.
          </p>
        ) : (
          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {entries.map(({ anime, def }, i) => (
              <article
                key={anime.id}
                className="ghibli-film-card group relative"
                style={{ animationDelay: `${Math.min(i, 16) * 30}ms` }}
              >
                <AnimePoster anime={anime} index={i} />
                <div className="mt-2 flex flex-wrap items-center gap-1.5 px-0.5">
                  <span className="rounded-md bg-[#c5d4b8]/10 px-1.5 py-0.5 text-[0.65rem] font-medium tabular-nums text-[#b8c9ae]">
                    {def.year}
                  </span>
                  {def.miyazaki ? (
                    <span className="rounded-md bg-[linear-gradient(135deg,rgba(197,212,184,0.18),rgba(158,192,216,0.12))] px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-[#d5e4cc] ring-1 ring-[#c5d4b8]/20">
                      Miyazaki
                    </span>
                  ) : (
                    <span className="text-[0.65rem] text-[#6f7f68]">
                      Studio Ghibli
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
