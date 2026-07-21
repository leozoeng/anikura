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

/** Compact Browse teaser — full collection + trailer live on /ghibli */
export function GhibliSelection({ entries }: Props) {
  if (!entries.length) return null;

  const miyazaki = ghibliMiyazakiCount(entries);
  const preview = entries.slice(0, 7);
  const hero =
    entries.find((e) => /spirited away/i.test(e.def.title)) ??
    entries.find((e) => /totoro/i.test(e.def.title)) ??
    entries[0];

  return (
    <section
      id="ghibli"
      className="ghibli-teaser relative mt-10 overflow-hidden rounded-[1.6rem] border border-[#c5d4b8]/22"
    >
      <div aria-hidden className="absolute inset-0">
        {hero?.anime.background_image || hero?.anime.poster ? (
          <Image
            src={hero.anime.background_image || hero.anime.poster}
            alt=""
            fill
            className="object-cover opacity-40"
            sizes="1200px"
            priority
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(115deg, rgba(8,14,11,0.96) 0%, rgba(12,22,16,0.88) 38%, rgba(10,18,14,0.62) 100%),
              radial-gradient(520px 260px at 85% 35%, rgba(160,205,175,0.28), transparent 62%),
              radial-gradient(420px 220px at 10% 80%, rgba(232,210,150,0.1), transparent 60%)
            `,
          }}
        />
        <div className="ghibli-cloud absolute -left-[6%] top-[18%] h-24 w-[40%] rounded-full bg-white/12 blur-3xl" />
        <div className="ghibli-cloud-slow absolute right-[-8%] top-[28%] h-20 w-[34%] rounded-full bg-[#c5dce8]/18 blur-3xl" />
      </div>

      {/* Decorative sky line */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c5d4b8]/35 to-transparent"
      />

      <div className="relative flex flex-col gap-7 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:p-7">
        <div className="max-w-md shrink-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-[#a8c4a0]">
            Studio Ghibli
          </p>
          <h2
            className="mt-2 text-[clamp(1.85rem,3.8vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#f7f3e8]"
            style={{ fontFamily: "var(--font-ghibli), var(--font-sans)" }}
          >
            Ghibli Selection
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-[#b4c6ac]">
            Soft meadows &amp; quiet skies — {entries.length} films,{" "}
            {miyazaki} by Miyazaki. Step into the full collection with a
            trailer in the clouds.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/ghibli"
              className="inline-flex items-center gap-2 rounded-full bg-[#e8f0dc] px-4 py-2.5 text-sm font-semibold text-[#1a2618] shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition hover:bg-[#f4f8ea] hover:shadow-[0_14px_36px_rgba(0,0,0,0.4)]"
            >
              Enter the collection
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="scrollbar-none -mx-1 flex items-end gap-2.5 overflow-x-auto px-1 pb-1 sm:gap-3">
            {preview.map(({ anime, def }, i) => (
              <Link
                key={anime.id}
                href={animeHref(anime)}
                className="ghibli-poster-tilt group relative w-[4.6rem] shrink-0 sm:w-[5.35rem] md:w-[5.85rem]"
                style={{
                  transform: `translateY(${(i % 3) * 5}px) rotate(${((i % 2) * 2 - 1) * 1.4}deg)`,
                }}
                title={`${def.title} (${def.year})`}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-[0.95rem] bg-[#152018] shadow-[0_14px_32px_rgba(0,0,0,0.5)] ring-1 ring-[#c5d4b8]/20 transition duration-400 group-hover:-translate-y-1.5 group-hover:rotate-0 group-hover:ring-[#e8f0dc]/45">
                  <Image
                    src={anime.poster}
                    alt={def.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.05]"
                    sizes="94px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1410]/80 via-transparent to-white/5" />
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/35 px-1 py-0.5 text-[0.55rem] font-medium tabular-nums text-[#e8f0dc] backdrop-blur-[2px]">
                    {def.year}
                  </span>
                </div>
              </Link>
            ))}
            <Link
              href="/ghibli"
              className="flex w-[4.6rem] shrink-0 flex-col items-center justify-center gap-1 rounded-[0.95rem] border border-dashed border-[#c5d4b8]/35 bg-[#c5d4b8]/10 text-center transition hover:border-[#e8f0dc]/55 hover:bg-[#c5d4b8]/16 sm:w-[5.35rem] md:w-[5.85rem]"
              style={{ aspectRatio: "2/3" }}
            >
              <span className="text-xl leading-none text-[#d5e4cc]">+</span>
              <span className="px-1.5 text-[0.62rem] font-medium leading-tight text-[#c5d4b8]">
                All {entries.length}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
