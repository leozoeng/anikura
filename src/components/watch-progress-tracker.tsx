"use client";

import { useEffect, useRef } from "react";
import {
  markEpisodeWatched,
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

/** After this much watch time, leaving the episode counts as finished. */
const MARK_WATCHED_AFTER_MS = 90_000;

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

    const persist = (percent: number) => {
      const clamped = Math.min(100, Math.max(0, Math.round(percent)));
      lastSaved.current = clamped;
      saveEpisodeProgress(id, episode, language, clamped);
      saveWatchProgress({
        id,
        slug,
        title,
        poster,
        episode,
        language,
        percent: clamped,
      });
    };

    const tick = () => {
      const elapsedMin = (Date.now() - started.current) / 60000;
      const percent = Math.min(100, (elapsedMin / durationMin) * 100);
      if (percent - lastSaved.current < 3 && percent < 75) return;
      persist(percent);
    };

    tick();
    const interval = setInterval(tick, 12000);
    const onHide = () => tick();
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);

      const elapsed = Date.now() - started.current;
      // If they spent meaningful time here then left (next ep, back, etc.), mark watched.
      if (elapsed >= MARK_WATCHED_AFTER_MS || lastSaved.current >= 75) {
        markEpisodeWatched(id, episode, language);
        saveWatchProgress({
          id,
          slug,
          title,
          poster,
          episode,
          language,
          percent: 100,
        });
      } else {
        tick();
      }
    };
  }, [id, slug, title, poster, episode, language, durationMin]);

  return null;
}
