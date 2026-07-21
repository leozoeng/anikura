"use client";

import { moodAccent } from "@/lib/genre-moods";

type Chip = { slug: string; name: string };

export function MoodJumpRail({ chips }: { chips: Chip[] }) {
  if (!chips.length) return null;

  return (
    <nav
      aria-label="Jump to mood"
      className="sticky top-14 z-30 -mx-5 mb-6 border-b border-white/[0.06] bg-void/85 px-5 py-2.5 backdrop-blur-xl sm:top-16 sm:-mx-8 sm:mb-8 sm:px-8 md:top-16"
    >
      <div className="scrollbar-none flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5">
        {chips.map((chip) => {
          const accent = moodAccent(chip.slug);
          return (
            <a
              key={chip.slug}
              href={`#mood-${chip.slug}`}
              className="pressable shrink-0 snap-start rounded-full border px-3 py-1.5 text-[0.75rem] font-medium tracking-[-0.01em] text-cloud transition hover:text-snow"
              style={{
                borderColor: `${accent.solid}35`,
                background: `${accent.solid}12`,
              }}
            >
              {chip.name}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
