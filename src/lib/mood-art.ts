import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type MoodArtOverride = {
  slug: string;
  image_url: string;
  updated_at: string;
};

/** Fetch admin-set mood image URL overrides. Empty map when Supabase is off. */
export async function fetchMoodArtOverrides(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!isSupabaseConfigured()) return map;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mood_art")
      .select("slug, image_url");

    if (error || !data) return map;

    for (const row of data as Array<{ slug: string; image_url: string }>) {
      if (row.slug && row.image_url) {
        map.set(row.slug, row.image_url);
      }
    }
  } catch {
    // Public pages should still render with local defaults.
  }

  return map;
}

export async function fetchMoodArtRows(): Promise<MoodArtOverride[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mood_art")
      .select("slug, image_url, updated_at")
      .order("slug");

    if (error || !data) return [];
    return data as MoodArtOverride[];
  } catch {
    return [];
  }
}
