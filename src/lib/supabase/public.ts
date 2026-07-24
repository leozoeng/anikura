import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Cookie-free anon client for public reads (mood art, etc.).
 * Avoids `cookies()` so ISR pages stay cacheable.
 */
export function createPublicClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;

  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
