"use client";

import { useEffect } from "react";
import {
  markEpisodeWatched,
  saveWatchProgress,
} from "@/lib/progress";

type Props = {
  id: number;
  slug: string;
  title: string;
  poster: string;
  episode: number;
  language: "sub" | "dub";
  /** Kept for call-site compatibility; unused. */
  durationMin?: number;
};

/** Mark the episode watched as soon as the watch page is opened. */
export function WatchProgressTracker({
  id,
  slug,
  title,
  poster,
  episode,
  language,
}: Props) {
  useEffect(() => {
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
  }, [id, slug, title, poster, episode, language]);

  return null;
}
