import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/catalog";
import type { ProfileCommentItem } from "@/lib/comments";

export async function fetchUserProfileComments(
  userId: string,
  limit = 40,
): Promise<ProfileCommentItem[]> {
  const supabase = await createClient();
  const take = Math.min(Math.max(limit, 1), 60);
  const [{ data, error }, catalog] = await Promise.all([
    supabase
      .from("anime_comments")
      .select("id, anime_id, episode, language, body, parent_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(take),
    getCatalog(),
  ]);

  if (error || !data?.length) return [];

  const byId = new Map(catalog.map((a) => [a.id, a]));

  return data.map((row) => {
    const anime = byId.get(Number(row.anime_id));
    return {
      id: String(row.id),
      anime_id: Number(row.anime_id),
      episode: Number(row.episode),
      language: row.language === "dub" ? "dub" : "sub",
      body: String(row.body ?? ""),
      parent_id: (row.parent_id as string | null) ?? null,
      created_at: String(row.created_at),
      animeTitle: anime?.title || `Anime #${row.anime_id}`,
      animeSlug: anime?.slug || "anime",
      animePoster: anime?.poster || null,
    };
  });
}
