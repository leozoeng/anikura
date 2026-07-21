import Image from "next/image";
import Link from "next/link";
import { animeHref } from "@/lib/anikoto";
import {
  moodAccent,
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
  priority?: boolean;
};

/** Ghibli-selection-style mood row — per-mood accent, copy, poster strip. */
export function MoodTeaser({
  name,
  slug,
  count,
  coverSrc,
  coverPosition,
  posters,
  priority = false,
}: MoodTeaserProps) {
  const copy = moodCopy(slug);
  const accent = moodAccent(slug);
  const preview = posters.slice(0, 7);
  const href = `/genres/${slug}`;
  const wash = moodVeil(slug);

  return (
    <section
      className="mood-teaser group/mood relative overflow-hidden rounded-[1.6rem]"
      style={{
        border: `1px solid color-mix(in oklab, ${accent.solid} 28%, transparent)`,
      }}
    >
      <div aria-hidden className="absolute inset-0">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt=""
            fill
            className={`object-cover opacity-[0.44] transition duration-700 group-hover/mood:scale-[1.03] group-hover/mood:opacity-[0.5] ${coverPosition ?? "object-center"}`}
            sizes="1200px"
            priority={priority}
          />
        ) : null}
        <div className="absolute inset-0" style={{ background: wash }} />
        <div
          className="mood-cloud absolute -left-[6%] top-[18%] h-24 w-[40%] rounded-full blur-3xl"
          style={{ background: `${accent.solid}22` }}
        />
        <div
          className="mood-cloud-slow absolute right-[-8%] top-[28%] h-20 w-[34%] rounded-full blur-3xl"
          style={{ background: `${accent.soft}28` }}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${accent.soft}66, transparent)`,
        }}
      />

      <div className="relative flex flex-col gap-6 p-5 sm:gap-7 sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:p-6">
        <div className="max-w-md shrink-0">
          <p
            className="text-[0.65rem] font-semibold uppercase tracking-[0.26em]"
            style={{ color: accent.soft }}
          >
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 text-[clamp(1.55rem,3.2vw,2.15rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-snow">
            {name}
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-cloud">
            {copy.blurb}{" "}
            <span className="text-mute">
              {count.toLocaleString()} titles.
            </span>
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={href}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition hover:brightness-110 hover:shadow-[0_14px_36px_rgba(0,0,0,0.4)]"
              style={{
                background: accent.solid,
                color: accent.ink,
              }}
            >
              {copy.cta}
              <span aria-hidden>→</span>
            </Link>
            <span
              className="rounded-full border bg-black/30 px-3 py-1.5 text-[0.7rem] tabular-nums text-cloud backdrop-blur-sm"
              style={{ borderColor: `${accent.solid}40` }}
            >
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
                <div className="relative aspect-[2/3] overflow-hidden rounded-[0.95rem] bg-black/40 shadow-[0_14px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/15 transition duration-400 group-hover:-translate-y-1.5 group-hover:rotate-0 group-hover:ring-white/35">
                  <Image
                    src={item.poster}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.05]"
                    sizes="94px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-white/5" />
                  {item.year ? (
                    <span
                      className="absolute bottom-1.5 left-1.5 rounded bg-black/40 px-1 py-0.5 text-[0.55rem] font-medium tabular-nums backdrop-blur-[2px]"
                      style={{ color: accent.mist }}
                    >
                      {item.year}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
            <Link
              href={href}
              className="flex w-[4.6rem] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-[0.95rem] border border-dashed text-center transition hover:brightness-110 sm:w-[5.5rem] md:w-[5.85rem]"
              style={{
                aspectRatio: "2/3",
                borderColor: `${accent.solid}55`,
                background: `${accent.solid}18`,
                color: accent.soft,
              }}
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
