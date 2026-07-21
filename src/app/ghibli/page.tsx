import Image from "next/image";
import Link from "next/link";
import { AnimePoster } from "@/components/anime-poster";
import { getCatalog } from "@/lib/catalog";
import {
  getGhibliCollection,
  ghibliMiyazakiCount,
} from "@/lib/ghibli";

export const metadata = {
  title: "Ghibli Selection",
  description:
    "Complete Studio Ghibli film collection on Anikura — Miyazaki and the Ghibli family.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ view?: string }>;
};

export default async function GhibliPage({ searchParams }: Props) {
  const { view } = await searchParams;
  const miyazakiOnly = view === "miyazaki";

  const catalog = await getCatalog();
  const all = getGhibliCollection(catalog);
  const entries = miyazakiOnly
    ? all.filter((e) => e.def.miyazaki)
    : all;
  const miyazakiCount = ghibliMiyazakiCount(all);

  const hero =
    all.find((e) => /spirited away/i.test(e.def.title)) ??
    all.find((e) => /totoro/i.test(e.def.title)) ??
    all[0];

  return (
    <div className="page-enter relative pb-20">
      {/* Hero */}
      <div className="relative isolate overflow-hidden border-b border-[#c5d4b8]/12">
        <div aria-hidden className="absolute inset-0">
          {hero ? (
            <Image
              src={hero.anime.background_image || hero.anime.poster}
              alt=""
              fill
              priority
              className="object-cover object-[center_30%] opacity-40"
              sizes="100vw"
            />
          ) : null}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(180deg, rgba(8,12,10,0.55) 0%, rgba(8,12,10,0.82) 55%, #080c0a 100%),
                radial-gradient(900px 400px at 20% 0%, rgba(168,210,170,0.2), transparent 55%),
                radial-gradient(700px 360px at 90% 20%, rgba(140,190,220,0.14), transparent 50%)
              `,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1200px] px-5 pb-12 pt-28 sm:px-8 sm:pb-14 sm:pt-32">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-sm text-[#9aaf94] transition hover:text-[#d5e4cc]"
          >
            ← Browse
          </Link>
          <p className="mt-5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#a8c4a0]">
            Studio Ghibli
          </p>
          <h1 className="mt-2 max-w-2xl text-[clamp(2.4rem,6vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.045em] text-[#f3f0e6]">
            Ghibli Selection
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#b0c0a8]">
            The complete shelf — theatrical features from Nausicaä of the
            Valley of the Wind to The Boy and the Heron. Soft meadows, moving
            castles, and quiet skies.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[0.75rem]">
            <span className="rounded-full border border-[#c5d4b8]/25 bg-[#c5d4b8]/10 px-3 py-1 font-medium text-[#d5e4cc]">
              {all.length} films
            </span>
            <span className="rounded-full border border-[#9ec0d8]/25 bg-[#9ec0d8]/10 px-3 py-1 font-medium text-[#c5dae8]">
              {miyazakiCount} by Hayao Miyazaki
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-5 pt-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/ghibli"
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              !miyazakiOnly
                ? "bg-[#e8f0dc] text-[#1a2618]"
                : "border border-white/10 text-[#b0c0a8] hover:border-white/20 hover:text-[#f3f0e6]"
            }`}
          >
            All films
          </Link>
          <Link
            href="/ghibli?view=miyazaki"
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              miyazakiOnly
                ? "bg-[#e8f0dc] text-[#1a2618]"
                : "border border-white/10 text-[#b0c0a8] hover:border-white/20 hover:text-[#f3f0e6]"
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
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {entries.map(({ anime, def }, i) => (
              <div key={anime.id} className="relative">
                <AnimePoster anime={anime} index={i} />
                <div className="mt-1.5 flex items-center gap-1.5 px-0.5">
                  <span className="text-[0.7rem] tabular-nums text-[#8fa888]">
                    {def.year}
                  </span>
                  {def.miyazaki ? (
                    <span className="rounded bg-[#c5d4b8]/12 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider text-[#c5d4b8]">
                      Miyazaki
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
