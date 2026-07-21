"use client";

import Link from "next/link";
import { CinematicBackdrop } from "@/components/cinematic-backdrop";

type Props = {
  trailerId?: string | null;
  posterSrc: string;
  title: string;
  filmCount: number;
  miyazakiCount: number;
};

export function GhibliHero({
  trailerId,
  posterSrc,
  title,
  filmCount,
  miyazakiCount,
}: Props) {
  return (
    <CinematicBackdrop
      videoId={trailerId}
      posterSrc={posterSrc}
      title={title}
      minHeightClass="min-h-[min(78svh,720px)]"
      scale={1.45}
      showAudioToggle
      className="ghibli-hero border-b border-[#c5d4b8]/15"
    >
      {/* Meadow / sky wash over trailer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: `
            linear-gradient(180deg, rgba(12,22,16,0.35) 0%, rgba(10,18,14,0.55) 45%, rgba(8,12,10,0.92) 100%),
            radial-gradient(900px 420px at 15% 10%, rgba(168,210,170,0.28), transparent 55%),
            radial-gradient(700px 380px at 90% 20%, rgba(150,195,220,0.2), transparent 50%),
            radial-gradient(500px 280px at 50% 100%, rgba(232,210,150,0.12), transparent 55%)
          `,
        }}
      />

      {/* Soft cloud blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-40"
      >
        <div className="ghibli-cloud absolute -left-[8%] top-[12%] h-28 w-[42%] rounded-full bg-white/15 blur-3xl" />
        <div className="ghibli-cloud-slow absolute right-[-4%] top-[22%] h-24 w-[36%] rounded-full bg-[#c5dce8]/20 blur-3xl" />
        <div className="ghibli-cloud absolute left-[30%] top-[8%] h-16 w-[28%] rounded-full bg-white/10 blur-2xl" />
      </div>

      <div className="relative z-[2] mx-auto flex min-h-[min(78svh,720px)] max-w-[1200px] flex-col justify-end px-5 pb-12 pt-28 sm:px-8 sm:pb-14 sm:pt-32">
        <Link
          href="/browse"
          className="mb-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-[#c5d4b8] backdrop-blur-sm transition hover:border-white/20 hover:text-[#f3f0e6]"
        >
          ← Browse
        </Link>

        <div className="mt-10 max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#b8d4b0]">
            Studio Ghibli
          </p>
          <h1
            className="mt-3 text-[clamp(2.6rem,7vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-[#f7f3e8]"
            style={{ fontFamily: "var(--font-ghibli), var(--font-sans)" }}
          >
            Ghibli Selection
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#c8d6c0] sm:text-lg">
            Soft meadows, moving castles, and quiet skies — the complete
            theatrical shelf, from Nausicaä to The Boy and the Heron.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-[0.75rem]">
            <span className="rounded-full border border-[#e8f0dc]/25 bg-[#e8f0dc]/12 px-3 py-1.5 font-medium text-[#e8f0dc] backdrop-blur-sm">
              {filmCount} films
            </span>
            <span className="rounded-full border border-[#9ec0d8]/30 bg-[#9ec0d8]/12 px-3 py-1.5 font-medium text-[#d0e6f2] backdrop-blur-sm">
              {miyazakiCount} by Hayao Miyazaki
            </span>
            {trailerId ? (
              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 font-medium text-white/70 backdrop-blur-sm">
                Trailer · {title}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </CinematicBackdrop>
  );
}
