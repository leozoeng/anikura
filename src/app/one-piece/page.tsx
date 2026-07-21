import Image from "next/image";
import Link from "next/link";
import { AnimePoster } from "@/components/anime-poster";
import { animeHref } from "@/lib/anikoto";
import { getCatalog } from "@/lib/catalog";
import {
  getOnePieceCollection,
  onePieceFilmCount,
} from "@/lib/one-piece";

export const metadata = {
  title: "One Piece Voyage",
  description:
    "The Grand Line on Anikura — the main series and iconic One Piece films.",
};

export const dynamic = "force-dynamic";

export default async function OnePiecePage() {
  const catalog = await getCatalog();
  const entries = getOnePieceCollection(catalog);
  const films = onePieceFilmCount(entries);
  const hero =
    entries.find((e) => /film red/i.test(e.def.title)) ??
    entries.find((e) => e.def.series) ??
    entries[0];
  const heroSrc =
    hero?.anime.background_image || hero?.anime.poster || null;

  return (
    <div className="page-enter relative pb-24">
      <section className="onepiece-hero relative overflow-hidden border-b border-[#f0a35a]/20">
        <div aria-hidden className="absolute inset-0">
          {heroSrc ? (
            <Image
              src={heroSrc}
              alt=""
              fill
              className="object-cover opacity-45"
              sizes="100vw"
              priority
            />
          ) : null}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(118deg, rgba(6,18,32,0.97) 0%, rgba(12,36,58,0.9) 42%, rgba(28,22,14,0.75) 100%),
                radial-gradient(640px 320px at 80% 30%, rgba(255,140,60,0.3), transparent 60%),
                radial-gradient(520px 280px at 15% 80%, rgba(40,140,210,0.24), transparent 58%)
              `,
            }}
          />
          <div className="featured-cloud absolute -left-[8%] top-[16%] h-28 w-[42%] rounded-full bg-[#3aa0e8]/16 blur-3xl" />
          <div className="featured-cloud-slow absolute right-[-6%] top-[24%] h-24 w-[36%] rounded-full bg-[#ff9a3c]/14 blur-3xl" />
          <div className="featured-wave absolute -bottom-8 left-[-10%] h-20 w-[55%] rounded-[100%] bg-[#2a7ec0]/18 blur-2xl" />
        </div>

        <div className="page-shell relative pb-14 pt-28 sm:pb-16 sm:pt-32">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#7ec8ff]">
            Grand Line
          </p>
          <h1 className="mt-3 max-w-2xl text-[clamp(2.4rem,6vw,4rem)] font-semibold tracking-[-0.05em] text-[#fff6e8]">
            One Piece Voyage
          </h1>
          <p className="mt-4 max-w-xl text-[#b8d4ea]">
            Set sail with the Straw Hats — {entries.length} titles, {films}{" "}
            films. Adventure, found family, and the next island over the horizon.
          </p>
          {hero ? (
            <Link
              href={animeHref(hero.anime)}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#ffd28a] to-[#f0a035] px-5 py-2.5 text-sm font-semibold text-[#1a1208] shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition hover:from-[#ffe0a8] hover:to-[#f5b04a]"
            >
              {hero.def.series ? "Start the voyage" : `Open ${hero.def.title}`}
              <span aria-hidden>→</span>
            </Link>
          ) : null}
        </div>
      </section>

      <div className="page-shell pt-10">
        {entries.length === 0 ? (
          <p className="text-mute">No One Piece titles found in the catalog yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {entries.map(({ anime, def }, i) => (
              <div key={anime.id} className="featured-card group relative">
                <AnimePoster anime={anime} index={i} />
                {def.film ? (
                  <span className="pointer-events-none absolute left-2 top-2 z-[1] rounded-full bg-[#0a1c2e]/75 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-[#ffd28a] ring-1 ring-[#f0a35a]/35 backdrop-blur-sm">
                    Film
                  </span>
                ) : null}
                {def.series ? (
                  <span className="pointer-events-none absolute left-2 top-2 z-[1] rounded-full bg-[#0a1c2e]/75 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-[#7ec8ff] ring-1 ring-[#3aa0e8]/35 backdrop-blur-sm">
                    Series
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
