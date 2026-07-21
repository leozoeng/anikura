import Image from "next/image";
import Link from "next/link";
import {
  ghibliMiyazakiCount,
  type GhibliCatalogEntry,
} from "@/lib/ghibli";
import { animeHref } from "@/lib/anikoto";

type Props = {
  entries: GhibliCatalogEntry[];
};

/** Compact Browse teaser — full collection lives on /ghibli */
export function GhibliSelection({ entries }: Props) {
  if (!entries.length) return null;

  const miyazaki = ghibliMiyazakiCount(entries);
  const preview = entries.slice(0, 8);
  const hero =
    entries.find((e) => /spirited away/i.test(e.def.title)) ??
    entries.find((e) => /totoro/i.test(e.def.title)) ??
    entries[0];

  return (
    <section
      id="ghibli"
      className="relative mt-10 overflow-hidden rounded-[1.5rem] border border-[#c5d4b8]/18"
    >
      {/* Atmosphere */}
      <div aria-hidden className="absolute inset-0">
        {hero?.anime.background_image || hero?.anime.poster ? (
          <Image
            src={hero.anime.background_image || hero.anime.poster}
            alt=""
            fill
            className="object-cover opacity-35"
            sizes="1200px"
            priority
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(105deg, rgba(10,16,12,0.97) 0%, rgba(12,20,16,0.88) 42%, rgba(10,16,12,0.55) 100%),
              radial-gradient(600px 280px at 80% 40%, rgba(160,200,170,0.2), transparent 60%)
            `,
          }}
        />
      </div>

      <div className="relative flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:p-7">
        <div className="max-w-md shrink-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#a8c4a0]">
            Studio Ghibli
          </p>
          <h2 className="mt-2 text-[clamp(1.75rem,3.5vw,2.35rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-[#f3f0e6]">
            Ghibli Selection
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-[#b0c0a8]">
            Hayao Miyazaki and the Studio Ghibli family — {entries.length}{" "}
            films, from Nausicaä to The Boy and the Heron.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Link
              href="/ghibli"
              className="inline-flex items-center gap-2 rounded-full bg-[#e8f0dc] px-4 py-2 text-sm font-semibold text-[#1a2618] transition hover:bg-[#f3f7ea]"
            >
              Enter the collection
              <span aria-hidden>→</span>
            </Link>
            <span className="text-xs text-[#8fa888]">
              {miyazaki} directed by Miyazaki
            </span>
          </div>
        </div>

        {/* Poster fan — images only, no title meta (avoids overlap) */}
        <div className="min-w-0 flex-1">
          <div className="scrollbar-none -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 sm:gap-3">
            {preview.map(({ anime, def }, i) => (
              <Link
                key={anime.id}
                href={animeHref(anime)}
                className="group relative w-[4.75rem] shrink-0 sm:w-[5.5rem] md:w-[6rem]"
                style={{
                  transform: `translateY(${(i % 2) * 6}px)`,
                }}
                title={`${def.title} (${def.year})`}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#152018] shadow-[0_12px_28px_rgba(0,0,0,0.45)] ring-1 ring-white/12 transition duration-300 group-hover:-translate-y-1 group-hover:ring-[#c5d4b8]/45">
                  <Image
                    src={anime.poster}
                    alt={def.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    sizes="96px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                  <span className="absolute bottom-1.5 left-1.5 text-[0.6rem] font-medium tabular-nums text-white/85">
                    {def.year}
                  </span>
                </div>
              </Link>
            ))}
            <Link
              href="/ghibli"
              className="flex w-[4.75rem] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#c5d4b8]/30 bg-[#c5d4b8]/08 text-center transition hover:border-[#c5d4b8]/50 hover:bg-[#c5d4b8]/14 sm:w-[5.5rem] md:w-[6rem]"
              style={{
                aspectRatio: "2/3",
                transform: `translateY(${(preview.length % 2) * 6}px)`,
              }}
            >
              <span className="text-lg text-[#d5e4cc]">+</span>
              <span className="px-1 text-[0.65rem] font-medium leading-tight text-[#c5d4b8]">
                All {entries.length}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
