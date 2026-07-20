"use client";

import { useEffect, useRef } from "react";
import {
  saveEpisodeProgress,
  saveWatchProgress,
} from "@/lib/progress";

type Props = {
  id: number;
  slug: string;
  title: string;
  poster: string;
  episode: number;
  language: "sub" | "dub";
  /** Typical episode length in minutes for progress estimation */
  durationMin?: number;
};

export function WatchProgressTracker({
  id,
  slug,
  title,
  poster,
  episode,
  language,
  durationMin = 24,
}: Props) {
  const started = useRef(Date.now());
  const lastSaved = useRef(0);

  useEffect(() => {
    started.current = Date.now();
    lastSaved.current = 0;

    const tick = () => {
      const elapsedMin = (Date.now() - started.current) / 60000;
      const percent = Math.min(92, (elapsedMin / durationMin) * 100);
      if (percent - lastSaved.current < 3 && percent < 90) return;

      lastSaved.current = percent;
      saveEpisodeProgress(id, episode, language, percent);
      saveWatchProgress({
        id,
        slug,
        title,
        poster,
        episode,
        language,
        percent,
      });
    };

    tick();
    const interval = setInterval(tick, 15000);
    const onHide = () => tick();
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
      tick();
    };
  }, [id, slug, title, poster, episode, language, durationMin]);

  return null;
}
