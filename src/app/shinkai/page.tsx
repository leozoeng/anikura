import Image from "next/image";
import Link from "next/link";
import { AnimePoster } from "@/components/anime-poster";
import { animeHref } from "@/lib/anikoto";
import { getCatalog } from "@/lib/catalog";
import { getShinkaiCollection } from "@/lib/shinkai";

export const metadata = {
  title: "Makoto Shinkai",
  description:
    "Skies, rain, and quiet longing — Makoto Shinkai films on Anikura.",
};

export const dynamic = "force-dynamic";

export default async function ShinkaiPage() {
  const catalog = await getCatalog();
  const entries = getShinkaiCollection(catalog);
  const hero =
    entries.find((e) => /your name/i.test(e.def.title)) ??
    entries.find((e) => /suzume/i.test(e.def.title)) ??
    entries[0];
  const heroSrc =
    hero?.anime.background_image || hero?.anime.poster || null;

  return (
    <div className="page-enter relative pb-24">
      <section className="shinkai-hero relative overflow-hidden border-b border-[#8bb4e8]/22">
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
                linear-gradient(120deg, rgba(8,12,28,0.97) 0%, rgba(18,28,52,0.9) 40%, rgba(42,24,38,0.72) 100%),
                radial-gradient(640px 340px at 78% 26%, rgba(120,170,255,0.34), transparent 62%),
                radial-gradient(480px 260px at 18% 78%, rgba(255,140,120,0.18), transparent 58%)
              `,
            }}
          />
          <div className="featured-cloud absolute -left-[6%] top-[14%] h-28 w-[40%] rounded-full bg-[#9ec4ff]/14 blur-3xl" />
          <div className="featured-cloud-slow absolute right-[-8%] top-[22%] h-24 w-[34%] rounded-full bg-[#ffb4a0]/12 blur-3xl" />
          <div className="featured-ray absolute left-[52%] top-[-25%] h-[150%] w-28 rotate-[16deg] bg-gradient-to-b from-white/12 to-transparent blur-xl" />
        </div>

        <div className="page-shell relative pb-14 pt-28 sm:pb-16 sm:pt-32">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#a8c8ff]">
            Makoto Shinkai
          </p>
          <h1 className="mt-3 max-w-2xl text-[clamp(2.4rem,6vw,4rem)] font-semibold tracking-[-0.05em] text-[#f4f7ff]">
            Skies &amp; Soft Light
          </h1>
          <p className="mt-4 max-w-xl text-[#b4c4e0]">
            {entries.length} films of rain-washed cities, train platforms, and
            the ache of almost — from Voices of a Distant Star to Suzume.
          </p>
          {hero ? (
            <Link
              href={animeHref(hero.anime)}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#e8f0ff] to-[#c8d8f8] px-5 py-2.5 text-sm font-semibold text-[#121828] shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition hover:from-[#f4f8ff] hover:to-[#d8e4ff]"
            >
              Watch {hero.def.title}
              <span aria-hidden>→</span>
            </Link>
          ) : null}
        </div>
      </section>

      <div className="page-shell pt-10">
        {entries.length === 0 ? (
          <p className="text-mute">No Shinkai films found in the catalog yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {entries.map(({ anime }, i) => (
              <AnimePoster key={anime.id} anime={anime} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
