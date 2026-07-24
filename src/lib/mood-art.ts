import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

export type MoodArtOverride = {
  slug: string;
  image_url: string;
  updated_at: string;
};

async function loadMoodArtOverrides(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!isSupabaseConfigured()) return map;

  try {
    const supabase = createPublicClient();
    if (!supabase) return map;

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

/** Cached public mood overrides — cookie-free so home/genres can ISR. */
export async function fetchMoodArtOverrides(): Promise<Map<string, string>> {
  if (!isSupabaseConfigured()) return new Map();

  // Maps don't serialize through unstable_cache — cache entries as pairs.
  const pairs = await unstable_cache(
    async () => {
      const map = await loadMoodArtOverrides();
      return [...map.entries()];
    },
    ["mood-art-overrides"],
    { revalidate: 300 },
  )();

  return new Map(pairs);
}

export async function fetchMoodArtRows(): Promise<MoodArtOverride[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    // Admin UI needs the cookie session client.
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
