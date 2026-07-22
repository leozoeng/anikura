import { SafeImage } from "@/components/safe-image";
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

/** Compact themed mood shelf — accent CTA + horizontal poster strip. */
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
  const preview = posters.slice(0, 6);
  const href = `/genres/${slug}`;
  const wash = moodVeil(slug);

  return (
    <section
      id={`mood-${slug}`}
      className="mood-teaser group/mood relative scroll-mt-28 overflow-hidden rounded-[1.25rem] sm:scroll-mt-32"
      style={{
        border: `1px solid color-mix(in oklab, ${accent.solid} 30%, transparent)`,
      }}
    >
      <div aria-hidden className="absolute inset-0">
        {coverSrc ? (
          <SafeImage
            src={coverSrc}
            alt=""
            fill
            className={`object-cover opacity-[0.4] transition duration-600 group-hover/mood:scale-[1.025] group-hover/mood:opacity-[0.46] ${coverPosition ?? "object-center"}`}
            sizes="1200px"
            priority={priority}
          />
        ) : null}
        <div className="absolute inset-0" style={{ background: wash }} />
        <div
          className="mood-cloud absolute -left-[8%] top-[20%] h-16 w-[36%] rounded-full blur-3xl"
          style={{ background: `${accent.solid}20` }}
        />
      </div>

      <div
        className="relative flex flex-col gap-4 p-4 sm:gap-5 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6"
      >
        <div className="max-w-sm shrink-0 lg:max-w-[16rem]">
          <p
            className="text-[0.6rem] font-semibold uppercase tracking-[0.22em]"
            style={{ color: accent.soft }}
          >
            {copy.eyebrow}
          </p>
          <h2 className="mt-1 text-[clamp(1.35rem,2.8vw,1.75rem)] font-semibold leading-tight tracking-[-0.03em] text-snow">
            {name}
          </h2>
          <p className="mt-1.5 line-clamp-2 text-[0.8125rem] leading-snug text-cloud">
            {copy.blurb}
          </p>
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <Link
              href={href}
              className="pressable inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.8125rem] font-semibold shadow-[0_8px_22px_rgba(0,0,0,0.32)] transition hover:brightness-110"
              style={{
                background: accent.solid,
                color: accent.ink,
              }}
            >
              {copy.cta}
              <span aria-hidden>→</span>
            </Link>
            <span className="text-[0.7rem] tabular-nums text-mute">
              {count.toLocaleString()} titles
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="scrollbar-none -mx-0.5 flex snap-x snap-mandatory items-end gap-2 overflow-x-auto px-0.5 pb-0.5">
            {preview.map((item, i) => (
              <Link
                key={`${slug}-${item.id}`}
                href={animeHref(item)}
                className="group relative w-[4.5rem] shrink-0 snap-start sm:w-[4.85rem]"
                style={{
                  transform: `translateY(${(i % 3) * 3}px)`,
                }}
                title={item.title}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-black/40 shadow-[0_10px_24px_rgba(0,0,0,0.45)] ring-1 ring-white/12 transition duration-400 group-hover:-translate-y-1 group-hover:ring-white/30">
                  <SafeImage
                    src={item.poster}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    sizes="80px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>
              </Link>
            ))}
            <Link
              href={href}
              className="flex w-[4rem] shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed text-center transition hover:brightness-110 sm:w-[4.5rem]"
              style={{
                aspectRatio: "2/3",
                borderColor: `${accent.solid}50`,
                background: `${accent.solid}14`,
                color: accent.soft,
              }}
            >
              <span className="text-lg leading-none opacity-80">+</span>
              <span className="px-1 text-[0.58rem] font-medium leading-tight">
                All
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
