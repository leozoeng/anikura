"use client";

import Link from "next/link";
import { CinematicBackdrop } from "@/components/cinematic-backdrop";

type Props = {
  trailerId?: string | null;
  posterSrc: string;
  title: string;
  filmCount: number;
};

export function ShinkaiHero({
  trailerId,
  posterSrc,
  title,
  filmCount,
}: Props) {
  return (
    <CinematicBackdrop
      videoId={trailerId}
      posterSrc={posterSrc}
      title={title}
      minHeightClass="min-h-[min(78svh,720px)]"
      scale={1.45}
      showAudioToggle
      className="shinkai-hero border-b border-white/10"
    >
      {/* Heavy dim veil — same contrast treatment as Ghibli, sky accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: `
            linear-gradient(180deg, rgba(4,8,18,0.58) 0%, rgba(6,10,22,0.72) 40%, rgba(3,5,12,0.96) 100%),
            linear-gradient(90deg, rgba(3,6,14,0.72) 0%, rgba(3,6,14,0.35) 42%, transparent 70%),
            radial-gradient(900px 420px at 82% 12%, rgba(120,170,255,0.16), transparent 55%),
            radial-gradient(700px 380px at 12% 78%, rgba(255,140,120,0.1), transparent 52%)
          `,
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-30"
      >
        <div className="featured-cloud absolute -left-[6%] top-[14%] h-28 w-[40%] rounded-full bg-[#9ec4ff]/12 blur-3xl" />
        <div className="featured-cloud-slow absolute right-[-8%] top-[22%] h-24 w-[34%] rounded-full bg-[#ffb4a0]/10 blur-3xl" />
        <div className="featured-ray absolute left-[52%] top-[-25%] h-[150%] w-28 rotate-[16deg] bg-gradient-to-b from-white/8 to-transparent blur-xl" />
      </div>

      <div className="page-shell relative z-[2] flex min-h-[min(78svh,720px)] flex-col justify-end pb-12 pt-28 sm:pb-14 sm:pt-32">
        <Link
          href="/browse"
          className="mb-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-sm text-white/75 backdrop-blur-sm transition hover:border-white/20 hover:text-white"
        >
          ← Browse
        </Link>

        <div className="mt-10 max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#a8c8ff]/90">
            Makoto Shinkai
          </p>
          <h1 className="mt-3 text-[clamp(2.6rem,7vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-white">
            Skies &amp; Soft Light
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
            Rain-washed cities, train platforms, and the ache of almost — from
            Voices of a Distant Star to Suzume.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-[0.75rem]">
            <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 font-medium text-white/90 backdrop-blur-sm">
              {filmCount} films
            </span>
            <span className="rounded-full border border-[#8bb4e8]/30 bg-black/40 px-3 py-1.5 font-medium text-[#c8d8f8] backdrop-blur-sm">
              Soft light · quiet longing
            </span>
          </div>
        </div>
      </div>
    </CinematicBackdrop>
  );
}
