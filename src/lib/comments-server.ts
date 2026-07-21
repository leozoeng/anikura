import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/catalog";
import type { ProfileCommentItem, SiteCommentItem } from "@/lib/comments";

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

/** Latest comments across all series episodes for the Social feed. */
export async function fetchRecentSiteComments(
  limit = 24,
): Promise<SiteCommentItem[]> {
  const supabase = await createClient();
  const take = Math.min(Math.max(limit, 1), 48);
  const [{ data, error }, catalog] = await Promise.all([
    supabase
      .from("anime_comments")
      .select(
        "id, anime_id, episode, language, body, parent_id, created_at, user_id, author:profiles!anime_comments_user_id_fkey(nickname, username, avatar_url)",
      )
      .order("created_at", { ascending: false })
      .limit(take),
    getCatalog(),
  ]);

  if (error || !data?.length) return [];

  const byId = new Map(catalog.map((a) => [a.id, a]));

  return data.map((row) => {
    const anime = byId.get(Number(row.anime_id));
    const author = row.author as
      | {
          nickname: string | null;
          username: string | null;
          avatar_url: string | null;
        }
      | {
          nickname: string | null;
          username: string | null;
          avatar_url: string | null;
        }[]
      | null;
    const a = Array.isArray(author) ? author[0] : author;
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
      user_id: String(row.user_id),
      authorNickname: a?.nickname ?? null,
      authorUsername: a?.username ?? null,
      authorAvatarUrl: a?.avatar_url ?? null,
    };
  });
}
