"use server";

import { revalidatePath } from "next/cache";
import { ensureAdminRole, isAdminUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function assertSlug(slug: string): string {
  const cleaned = slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleaned)) {
    throw new Error("Invalid mood slug");
  }
  return cleaned;
}

async function requireAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const ok = await isAdminUser();
  if (!ok) throw new Error("Admin only");
  await ensureAdminRole();
}

export async function saveMoodArtOverride(slug: string, imageUrl: string) {
  await requireAdmin();
  const mood = assertSlug(slug);
  const url = imageUrl.trim();
  if (!url) throw new Error("Image URL required");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("mood_art").upsert(
    {
      slug: mood,
      image_url: url,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    },
    { onConflict: "slug" },
  );

  if (error) throw new Error(error.message);

  revalidateMoodPaths(mood);
  return { ok: true as const };
}

export async function resetMoodArtOverride(slug: string) {
  await requireAdmin();
  const mood = assertSlug(slug);

  const supabase = await createClient();
  const { error } = await supabase.from("mood_art").delete().eq("slug", mood);

  if (error) throw new Error(error.message);

  revalidateMoodPaths(mood);
  return { ok: true as const };
}

function revalidateMoodPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/genres");
  revalidatePath(`/genres/${slug}`);
  revalidatePath("/admin");
}
