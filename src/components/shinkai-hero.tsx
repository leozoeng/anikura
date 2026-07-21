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
      className="shinkai-hero border-b border-[#8bb4e8]/22"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: `
            linear-gradient(180deg, rgba(8,12,28,0.38) 0%, rgba(14,20,42,0.6) 45%, rgba(8,10,20,0.94) 100%),
            radial-gradient(900px 420px at 78% 16%, rgba(120,170,255,0.34), transparent 55%),
            radial-gradient(700px 380px at 14% 72%, rgba(255,140,120,0.2), transparent 52%),
            radial-gradient(500px 280px at 50% 100%, rgba(180,200,255,0.1), transparent 55%)
          `,
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-45"
      >
        <div className="featured-cloud absolute -left-[6%] top-[14%] h-28 w-[40%] rounded-full bg-[#9ec4ff]/16 blur-3xl" />
        <div className="featured-cloud-slow absolute right-[-8%] top-[22%] h-24 w-[34%] rounded-full bg-[#ffb4a0]/14 blur-3xl" />
        <div className="featured-ray absolute left-[52%] top-[-25%] h-[150%] w-28 rotate-[16deg] bg-gradient-to-b from-white/12 to-transparent blur-xl" />
      </div>

      <div className="page-shell relative z-[2] flex min-h-[min(78svh,720px)] flex-col justify-end pb-12 pt-28 sm:pb-14 sm:pt-32">
        <Link
          href="/browse"
          className="mb-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-[#a8c8ff] backdrop-blur-sm transition hover:border-white/20 hover:text-[#f4f7ff]"
        >
          ← Browse
        </Link>

        <div className="mt-10 max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#a8c8ff]">
            Makoto Shinkai
          </p>
          <h1 className="mt-3 text-[clamp(2.6rem,7vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-[#f4f7ff]">
            Skies &amp; Soft Light
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#b4c4e0] sm:text-lg">
            Rain-washed cities, train platforms, and the ache of almost — from
            Voices of a Distant Star to Suzume.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-[0.75rem]">
            <span className="rounded-full border border-[#8bb4e8]/30 bg-[#8bb4e8]/14 px-3 py-1.5 font-medium text-[#d0e0ff] backdrop-blur-sm">
              {filmCount} films
            </span>
            <span className="rounded-full border border-[#ffb4a0]/28 bg-[#ffb4a0]/12 px-3 py-1.5 font-medium text-[#ffd4c8] backdrop-blur-sm">
              Soft light · quiet longing
            </span>
          </div>
        </div>
      </div>
    </CinematicBackdrop>
  );
}
