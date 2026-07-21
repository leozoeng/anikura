import Image from "next/image";
import Link from "next/link";
import { moodCopy, moodVeil } from "@/lib/genre-moods";

type Props = {
  name: string;
  slug: string;
  count: number;
  coverSrc?: string | null;
  coverPosition?: string;
  credit?: string;
};

/** Cinematic mood detail hero — Ghibli-page energy, sakura language. */
export function MoodHero({
  name,
  slug,
  count,
  coverSrc,
  coverPosition,
  credit,
}: Props) {
  const copy = moodCopy(slug);

  return (
    <header className="mood-hero relative overflow-hidden border-b border-white/[0.08]">
      <div aria-hidden className="absolute inset-0">
        {coverSrc ? (
          <>
            <Image
              src={coverSrc}
              alt=""
              fill
              priority
              sizes="100vw"
              className={`scale-110 object-cover opacity-50 blur-[2px] sm:opacity-[0.55] ${coverPosition ?? "object-center"}`}
            />
            <Image
              src={coverSrc}
              alt=""
              fill
              priority
              sizes="100vw"
              className={`object-cover opacity-35 ${coverPosition ?? "object-center"}`}
            />
          </>
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.62) 48%, rgba(0,0,0,0.94) 100%),
              ${moodVeil(slug)}
            `,
          }}
        />
        <div className="mood-cloud absolute -left-[8%] top-[14%] h-28 w-[42%] rounded-full bg-sakura/12 blur-3xl" />
        <div className="mood-cloud-slow absolute right-[-4%] top-[24%] h-24 w-[36%] rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative z-[2] mx-auto flex min-h-[min(62svh,560px)] max-w-[1200px] flex-col justify-end px-5 pb-12 pt-28 sm:min-h-[min(68svh,620px)] sm:px-8 sm:pb-14 sm:pt-32">
        <div className="mb-auto flex flex-wrap items-center gap-2">
          <Link
            href="/genres"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-cloud backdrop-blur-sm transition hover:border-white/20 hover:text-snow"
          >
            ← All moods
          </Link>
          <Link
            href="/browse"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-3 py-1.5 text-sm text-mute backdrop-blur-sm transition hover:border-white/16 hover:text-cloud"
          >
            Browse
          </Link>
        </div>

        <div className="mt-10 max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-sakura-soft">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-[clamp(2.6rem,7vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-snow">
            {name}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-cloud sm:text-lg">
            {copy.hero}
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-[0.75rem]">
            <span className="rounded-full border border-sakura/30 bg-sakura/12 px-3 py-1.5 font-medium text-sakura-mist backdrop-blur-sm">
              {count.toLocaleString()} titles
            </span>
            <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 font-medium text-cloud backdrop-blur-sm">
              Mood shelf
            </span>
            {credit ? (
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 font-medium text-mute backdrop-blur-sm">
                Art · {credit}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
