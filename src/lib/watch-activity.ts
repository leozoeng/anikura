import type { WatchProgress } from "@/lib/progress";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type WatchActivityRow = {
  anime_id: number;
  slug: string;
  title: string;
  poster: string | null;
  episode: number;
  language: "sub" | "dub";
  percent: number;
  updated_at: string;
};

export const WATCH_ACTIVITY_SELECT =
  "anime_id, slug, title, poster, episode, language, percent, updated_at";

export function watchActivityToProgress(row: WatchActivityRow): WatchProgress {
  return {
    id: row.anime_id,
    slug: row.slug,
    title: row.title,
    poster: row.poster ?? "",
    episode: row.episode,
    language: row.language === "dub" ? "dub" : "sub",
    percent: row.percent,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

/** Fire-and-forget upsert so public Activity can show continue-watching. */
export async function syncWatchActivity(entry: {
  id: number;
  slug: string;
  title: string;
  poster: string;
  episode: number;
  language: "sub" | "dub";
  percent?: number;
}) {
  if (!isSupabaseConfigured() || typeof window === "undefined") return;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const percent = Math.min(100, Math.max(0, Math.round(entry.percent ?? 0)));
    await supabase.from("watch_activity").upsert(
      {
        user_id: user.id,
        anime_id: entry.id,
        slug: entry.slug,
        title: entry.title,
        poster: entry.poster || null,
        episode: entry.episode,
        language: entry.language,
        percent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,anime_id" },
    );
  } catch {
    // Local progress still works offline / without auth.
  }
}

/** Push the current local continue list to the server (owner devices). */
export async function flushContinueWatching(items: WatchProgress[]) {
  if (!items.length) return;
  await Promise.all(
    items.slice(0, 24).map((item) =>
      syncWatchActivity({
        id: item.id,
        slug: item.slug,
        title: item.title,
        poster: item.poster,
        episode: item.episode,
        language: item.language,
        percent: item.percent,
      }),
    ),
  );
}
