import { AnimePoster } from "@/components/anime-poster";
import { BrowseFeatured, type FeaturedSlide } from "@/components/browse-featured";
import { PagePagination } from "@/components/page-pagination";
import { getCatalog, getSyncMeta } from "@/lib/catalog";
import { getGhibliCollection, ghibliMiyazakiCount } from "@/lib/ghibli";
import { getOnePieceCollection, onePieceFilmCount } from "@/lib/one-piece";
import { getShinkaiCollection } from "@/lib/shinkai";
import type { CatalogAnime } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ sort?: string; page?: string }>;
};

function toPosters(
  entries: { anime: CatalogAnime; def: { title: string; year: number } }[],
) {
  return entries
    .filter((e) => e.anime.poster)
    .map((e) => ({
      id: e.anime.id,
      slug: e.anime.slug,
      title: e.def.title,
      year: e.def.year || e.anime.year || 0,
      poster: e.anime.poster,
    }));
}

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const sort = params.sort || "recent";
  const page = Math.max(1, Number(params.page || 1));
  const perPage = 48;

  const [catalog, meta] = await Promise.all([getCatalog(), getSyncMeta()]);
  const ghibli = getGhibliCollection(catalog);
  const onePiece = getOnePieceCollection(catalog);
  const shinkai = getShinkaiCollection(catalog);

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

  const featuredSlides: FeaturedSlide[] = [];

  if (ghibli.length) {
    const miyazaki = ghibliMiyazakiCount(ghibli);
    const hero =
      ghibli.find((e) => /spirited away/i.test(e.def.title)) ??
      ghibli.find((e) => /totoro/i.test(e.def.title)) ??
      ghibli[0];
    featuredSlides.push({
      id: "ghibli",
      eyebrow: "Studio Ghibli",
      title: "Ghibli Selection",
      body: `Soft meadows & quiet skies — ${ghibli.length} films, ${miyazaki} by Miyazaki. Step into the full collection with a trailer in the clouds.`,
      href: "/ghibli",
      cta: "Enter the collection",
      heroSrc: hero?.anime.background_image || hero?.anime.poster || null,
      posters: toPosters(ghibli),
      totalLabel: `All ${ghibli.length}`,
    });
  }

  if (onePiece.length) {
    const films = onePieceFilmCount(onePiece);
    const hero =
      onePiece.find((e) => /film red/i.test(e.def.title)) ??
      onePiece.find((e) => e.def.series) ??
      onePiece[0];
    featuredSlides.push({
      id: "onepiece",
      eyebrow: "Grand Line",
      title: "One Piece Voyage",
      body: `Sail the seas with the Straw Hats — ${onePiece.length} titles, ${films} films. Adventure, found family, and the next island ahead.`,
      href: "/one-piece",
      cta: "Set sail",
      heroSrc: hero?.anime.background_image || hero?.anime.poster || null,
      posters: toPosters(onePiece),
      totalLabel: `All ${onePiece.length}`,
    });
  }

  if (shinkai.length) {
    const hero =
      shinkai.find((e) => /your name/i.test(e.def.title)) ??
      shinkai.find((e) => /suzume/i.test(e.def.title)) ??
      shinkai[0];
    featuredSlides.push({
      id: "shinkai",
      eyebrow: "Makoto Shinkai",
      title: "Skies & Soft Light",
      body: `${shinkai.length} films of rain-washed cities and quiet longing — from Distant Star to Suzume.`,
      href: "/shinkai",
      cta: "Enter the sky",
      heroSrc: hero?.anime.background_image || hero?.anime.poster || null,
      posters: toPosters(shinkai),
      totalLabel: `All ${shinkai.length}`,
    });
  }

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
        Browse
      </h1>
      <p className="mt-3 max-w-xl text-cloud">
        {meta
          ? `${meta.totalAnime.toLocaleString()} titles waiting for a quiet night · updated ${new Date(meta.syncedAt).toLocaleDateString()}`
          : "Run a catalog sync to fill this shelf."}
      </p>

      {page === 1 ? <BrowseFeatured slides={featuredSlides} /> : null}

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
        {ghibli.length > 0 ? (
          <Link
            href="/ghibli"
            className="filter-pill !border-[#c5d4b8]/25 !text-[#c5d4b8]"
          >
            Ghibli
          </Link>
        ) : null}
        {onePiece.length > 0 ? (
          <Link
            href="/one-piece"
            className="filter-pill !border-[#f0a35a]/30 !text-[#ffd28a]"
          >
            One Piece
          </Link>
        ) : null}
        {shinkai.length > 0 ? (
          <Link
            href="/shinkai"
            className="filter-pill !border-[#8bb4e8]/30 !text-[#a8c8ff]"
          >
            Shinkai
          </Link>
        ) : null}
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

          <PagePagination
            page={Math.min(page, totalPages)}
            totalPages={totalPages}
            hrefForPage={(p) => `/browse?sort=${sort}&page=${p}`}
          />
        </>
      )}
    </div>
  );
}
