import "server-only";

import { createClient } from "@/lib/supabase/server";

export type SocialAnnouncement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  authorNickname: string | null;
  authorUsername: string | null;
};

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

async function attachAuthors(
  rows: AnnouncementRow[],
): Promise<SocialAnnouncement[]> {
  if (!rows.length) return [];

  const authorIds = [
    ...new Set(rows.map((r) => r.author_id).filter(Boolean) as string[]),
  ];
  const byId = new Map<
    string,
    { nickname: string | null; username: string | null }
  >();

  if (authorIds.length) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, nickname, username")
      .in("id", authorIds);
    for (const p of data ?? []) {
      byId.set(String(p.id), {
        nickname: (p.nickname as string | null) ?? null,
        username: (p.username as string | null) ?? null,
      });
    }
  }

  return rows.map((row) => {
    const author = row.author_id ? byId.get(row.author_id) : null;
    return {
      id: String(row.id),
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
      pinned: Boolean(row.pinned),
      published: Boolean(row.published),
      author_id: row.author_id,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      authorNickname: author?.nickname ?? null,
      authorUsername: author?.username ?? null,
    };
  });
}

export async function fetchSocialAnnouncements(
  limit = 12,
): Promise<SocialAnnouncement[]> {
  const supabase = await createClient();
  const take = Math.min(Math.max(limit, 1), 40);

  const { data, error } = await supabase
    .from("social_announcements")
    .select(
      "id, title, body, pinned, published, author_id, created_at, updated_at",
    )
    .eq("published", true)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(take);

  if (error || !data?.length) return [];
  return attachAuthors(data as AnnouncementRow[]);
}

/** Admin desk — includes drafts. */
export async function fetchAllSocialAnnouncements(): Promise<
  SocialAnnouncement[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_announcements")
    .select(
      "id, title, body, pinned, published, author_id, created_at, updated_at",
    )
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  if (error || !data?.length) return [];
  return attachAuthors(data as AnnouncementRow[]);
}
