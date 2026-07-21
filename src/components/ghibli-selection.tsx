import Image from "next/image";
import Link from "next/link";
import { AnimePoster } from "@/components/anime-poster";
import {
  ghibliMiyazakiCount,
  type GhibliCatalogEntry,
} from "@/lib/ghibli";
import { animeHref } from "@/lib/anikoto";

type Props = {
  entries: GhibliCatalogEntry[];
};

export function GhibliSelection({ entries }: Props) {
  if (!entries.length) return null;

  const miyazaki = ghibliMiyazakiCount(entries);
  const hero = entries.find((e) => /totoro|spirited|mononoke|heron/i.test(e.def.title))
    ?? entries[Math.min(3, entries.length - 1)];

  return (
    <section
      id="ghibli"
      className="ghibli-selection relative mt-12 overflow-hidden rounded-[1.75rem] border border-[#c5d4b8]/20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(900px 420px at 12% 0%, rgba(168, 210, 170, 0.22), transparent 55%),
            radial-gradient(700px 380px at 88% 10%, rgba(140, 190, 220, 0.18), transparent 50%),
            radial-gradient(600px 300px at 50% 100%, rgba(240, 220, 160, 0.1), transparent 60%),
            linear-gradient(165deg, #0f1612 0%, #121a16 40%, #0c1210 100%)
          `,
        }}
      />
      {/* Soft paper grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:gap-10 lg:p-8">
        <div className="flex flex-col justify-between gap-6">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#a8c4a0]">
              Studio Ghibli
            </p>
            <h2 className="mt-2 font-serif text-[clamp(1.85rem,4vw,2.6rem)] leading-[1.1] tracking-[-0.02em] text-[#f3f0e6]">
              Ghibli Selection
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#b8c5b0]">
              The complete shelf — Hayao Miyazaki and the Studio Ghibli
              family, from Nausicaä to The Boy and the Heron.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[0.7rem]">
              <span className="rounded-full border border-[#c5d4b8]/25 bg-[#c5d4b8]/10 px-2.5 py-1 font-medium text-[#d5e4cc]">
                {entries.length} films
              </span>
              <span className="rounded-full border border-[#9ec0d8]/25 bg-[#9ec0d8]/10 px-2.5 py-1 font-medium text-[#c5dae8]">
                {miyazaki} by Miyazaki
              </span>
            </div>
          </div>

          {hero ? (
            <Link
              href={animeHref(hero.anime)}
              className="group relative hidden overflow-hidden rounded-2xl border border-white/10 lg:block"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={
                    hero.anime.background_image ||
                    hero.anime.poster
                  }
                  alt=""
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  sizes="420px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1210] via-[#0c1210]/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[#a8c4a0]">
                    {hero.def.miyazaki ? "Miyazaki" : "Studio Ghibli"} ·{" "}
                    {hero.def.year}
                  </p>
                  <p className="mt-1 text-lg font-medium tracking-[-0.02em] text-[#f3f0e6]">
                    {hero.def.title}
                  </p>
                </div>
              </div>
            </Link>
          ) : null}
        </div>

        <div>
          <div className="mb-4 flex items-end justify-between gap-3">
            <p className="text-sm text-[#9aaf94]">
              Chronological · full collection in the library
            </p>
          </div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
            {entries.map(({ anime, def }, i) => (
              <div key={anime.id} className="relative">
                <AnimePoster anime={anime} index={i} className="!block" />
                {def.miyazaki ? (
                  <span
                    title="Directed by Hayao Miyazaki"
                    className="pointer-events-none absolute bottom-8 left-1.5 z-[2] rounded bg-[#1a2a1c]/9 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider text-[#c5e0bc] ring-1 ring-[#c5d4b8]/25"
                  >
                    Miyazaki
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
