import Image from "next/image";
import Link from "next/link";
import { animeHref } from "@/lib/anikoto";
import {
  moodCopy,
  moodVeil,
  type MoodPreviewPoster,
} from "@/lib/genre-moods";

export type MoodTeaserProps = {
  name: string;
  slug: string;
  count: number;
  coverSrc?: string | null;
  coverPosition?: string;
  posters: MoodPreviewPoster[];
  /** Featured rows get taller type + padding */
  featured?: boolean;
  priority?: boolean;
};

/** Ghibli-selection-style mood row — art, copy, CTA, horizontal poster strip. */
export function MoodTeaser({
  name,
  slug,
  count,
  coverSrc,
  coverPosition,
  posters,
  featured = false,
  priority = false,
}: MoodTeaserProps) {
  const copy = moodCopy(slug);
  const preview = posters.slice(0, featured ? 8 : 7);
  const href = `/genres/${slug}`;
  const wash = moodVeil(slug);

  return (
    <section
      className={`mood-teaser group/mood relative overflow-hidden rounded-[1.6rem] border border-white/[0.1] ${
        featured ? "mood-teaser--featured" : ""
      }`}
    >
      <div aria-hidden className="absolute inset-0">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt=""
            fill
            className={`object-cover opacity-[0.42] transition duration-700 group-hover/mood:scale-[1.03] group-hover/mood:opacity-[0.48] ${coverPosition ?? "object-center"}`}
            sizes="1200px"
            priority={priority}
          />
        ) : null}
        <div className="absolute inset-0" style={{ background: wash }} />
        <div className="mood-cloud absolute -left-[6%] top-[18%] h-24 w-[40%] rounded-full bg-sakura/10 blur-3xl" />
        <div className="mood-cloud-slow absolute right-[-8%] top-[28%] h-20 w-[34%] rounded-full bg-white/10 blur-3xl" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sakura/35 to-transparent"
      />

      <div
        className={`relative flex flex-col gap-6 sm:gap-7 ${
          featured
            ? "p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:p-8"
            : "p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:p-6"
        }`}
      >
        <div className={`max-w-md shrink-0 ${featured ? "lg:max-w-lg" : ""}`}>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-sakura-soft">
            {copy.eyebrow}
          </p>
          <h2
            className={`mt-2 font-semibold leading-[1.05] tracking-[-0.03em] text-snow ${
              featured
                ? "text-[clamp(1.95rem,4vw,2.75rem)]"
                : "text-[clamp(1.55rem,3.2vw,2.15rem)]"
            }`}
          >
            {name}
          </h2>
          <p
            className={`mt-2.5 leading-relaxed text-cloud ${
              featured ? "text-[0.95rem] sm:text-base" : "text-sm"
            }`}
          >
            {copy.blurb}{" "}
            <span className="text-mute">
              {count.toLocaleString()} titles.
            </span>
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={href}
              className="inline-flex items-center gap-2 rounded-full bg-sakura px-4 py-2.5 text-sm font-semibold text-[#1a1014] shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition hover:bg-sakura-mist hover:shadow-[0_14px_36px_rgba(0,0,0,0.4)]"
            >
              {copy.cta}
              <span aria-hidden>→</span>
            </Link>
            <span className="rounded-full border border-white/12 bg-black/25 px-3 py-1.5 text-[0.7rem] tabular-nums text-cloud backdrop-blur-sm">
              {count.toLocaleString()} in mood
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="scrollbar-none -mx-1 flex snap-x snap-mandatory items-end gap-2.5 overflow-x-auto px-1 pb-1 sm:gap-3">
            {preview.map((item, i) => (
              <Link
                key={`${slug}-${item.id}`}
                href={animeHref(item)}
                className="group relative w-[5.35rem] shrink-0 snap-start sm:w-[5.5rem] md:w-[5.85rem]"
                style={{
                  transform: `translateY(${(i % 3) * 5}px) rotate(${((i % 2) * 2 - 1) * 1.4}deg)`,
                }}
                title={`${item.title}${item.year ? ` (${item.year})` : ""}`}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-[0.95rem] bg-black/40 shadow-[0_14px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/15 transition duration-400 group-hover:-translate-y-1.5 group-hover:rotate-0 group-hover:ring-sakura/45">
                  <Image
                    src={item.poster}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.05]"
                    sizes="94px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-white/5" />
                  {item.year ? (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-black/35 px-1 py-0.5 text-[0.55rem] font-medium tabular-nums text-sakura-mist backdrop-blur-[2px]">
                      {item.year}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
            <Link
              href={href}
              className="flex w-[4.6rem] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-[0.95rem] border border-dashed border-sakura/35 bg-sakura/10 text-center text-sakura-soft transition hover:border-sakura/55 hover:bg-sakura/16 sm:w-[5.5rem] md:w-[5.85rem]"
              style={{ aspectRatio: "2/3" }}
            >
              <span className="text-xl leading-none opacity-80">+</span>
              <span className="px-1.5 text-[0.62rem] font-medium leading-tight">
                All {count.toLocaleString()}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
