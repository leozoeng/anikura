"use server";

import { revalidatePath } from "next/cache";
import { ensureAdminRole, getSessionUser, isAdminUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function assertAdmin() {
  return isAdminUser().then(async (ok) => {
    if (!ok) throw new Error("Admin only");
    await ensureAdminRole();
  });
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  pinned?: boolean;
  published?: boolean;
}) {
  await assertAdmin();
  const user = await getSessionUser();
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) throw new Error("Title and body are required");
  if (title.length > 120) throw new Error("Title is too long");
  if (body.length > 4000) throw new Error("Body is too long");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_announcements")
    .insert({
      title,
      body,
      pinned: input.pinned ?? true,
      published: input.published ?? true,
      author_id: user?.id ?? null,
    })
    .select(
      "id, title, body, pinned, published, author_id, created_at, updated_at",
    )
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  revalidatePath("/admin");
  return data;
}

export async function updateAnnouncement(
  id: string,
  patch: {
    title?: string;
    body?: string;
    pinned?: boolean;
    published?: boolean;
  },
) {
  await assertAdmin();
  const next: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title != null) {
    const title = patch.title.trim();
    if (!title) throw new Error("Title is required");
    next.title = title;
  }
  if (patch.body != null) {
    const body = patch.body.trim();
    if (!body) throw new Error("Body is required");
    next.body = body;
  }
  if (patch.pinned != null) next.pinned = patch.pinned;
  if (patch.published != null) next.published = patch.published;

  const supabase = await createClient();
  const { error } = await supabase
    .from("social_announcements")
    .update(next)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  revalidatePath("/admin");
}

export async function deleteAnnouncement(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("social_announcements")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  revalidatePath("/admin");
}
