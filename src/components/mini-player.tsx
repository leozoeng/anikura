"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  title: string;
  episode: number;
  episodeTitle?: string;
  poster: string;
  watchHref: string;
  playerAnchorId: string;
};

export function MiniPlayer({
  title,
  episode,
  episodeTitle,
  poster,
  watchHref,
  playerAnchorId,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(playerAnchorId);
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [playerAnchorId]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[110] border-t border-white/10 bg-black/90 backdrop-blur-xl animate-rise">
      <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-3 sm:px-8">
        <Link
          href={`#${playerAnchorId}`}
          className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md ring-1 ring-white/10"
        >
          <Image src={poster} alt="" fill className="object-cover" sizes="36px" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium tracking-[-0.02em]">
            {title}
          </p>
          <p className="truncate text-xs text-mute">
            Ep {episode}
            {episodeTitle ? ` · ${episodeTitle}` : ""}
          </p>
        </div>
        <Link
          href={watchHref}
          className="rounded-full bg-snow px-4 py-1.5 text-xs font-medium text-void"
        >
          Back to player
        </Link>
      </div>
    </div>
  );
}
