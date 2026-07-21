"use client";

import Link from "next/link";
import { CinematicBackdrop } from "@/components/cinematic-backdrop";

type Props = {
  trailerId?: string | null;
  posterSrc: string;
  title: string;
  entryCount: number;
  filmCount: number;
};

export function OnePieceHero({
  trailerId,
  posterSrc,
  title,
  entryCount,
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
      className="onepiece-hero border-b border-[#f0a35a]/20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: `
            linear-gradient(180deg, rgba(6,18,32,0.4) 0%, rgba(10,28,48,0.62) 45%, rgba(8,14,22,0.94) 100%),
            radial-gradient(900px 420px at 85% 18%, rgba(255,140,60,0.32), transparent 55%),
            radial-gradient(700px 380px at 12% 70%, rgba(40,140,210,0.28), transparent 52%),
            radial-gradient(500px 280px at 50% 100%, rgba(255,180,90,0.1), transparent 55%)
          `,
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-45"
      >
        <div className="featured-cloud absolute -left-[8%] top-[16%] h-28 w-[42%] rounded-full bg-[#3aa0e8]/18 blur-3xl" />
        <div className="featured-cloud-slow absolute right-[-6%] top-[24%] h-24 w-[36%] rounded-full bg-[#ff9a3c]/16 blur-3xl" />
        <div className="featured-wave absolute -bottom-8 left-[-10%] h-20 w-[55%] rounded-[100%] bg-[#2a7ec0]/20 blur-2xl" />
      </div>

      <div className="page-shell relative z-[2] flex min-h-[min(78svh,720px)] flex-col justify-end pb-12 pt-28 sm:pb-14 sm:pt-32">
        <Link
          href="/browse"
          className="mb-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-[#7ec8ff] backdrop-blur-sm transition hover:border-white/20 hover:text-[#fff6e8]"
        >
          ← Browse
        </Link>

        <div className="mt-10 max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#7ec8ff]">
            Grand Line
          </p>
          <h1 className="mt-3 text-[clamp(2.6rem,7vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-[#fff6e8]">
            One Piece Voyage
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#b8d4ea] sm:text-lg">
            Set sail with the Straw Hats — adventure, found family, and the next
            island over the horizon.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-[0.75rem]">
            <span className="rounded-full border border-[#7ec8ff]/30 bg-[#3aa0e8]/14 px-3 py-1.5 font-medium text-[#c8e8ff] backdrop-blur-sm">
              {entryCount} titles
            </span>
            <span className="rounded-full border border-[#f0a35a]/35 bg-[#f0a35a]/14 px-3 py-1.5 font-medium text-[#ffd28a] backdrop-blur-sm">
              {filmCount} films
            </span>
          </div>
        </div>
      </div>
    </CinematicBackdrop>
  );
}
