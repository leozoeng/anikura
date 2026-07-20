import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type Profile = {
  id: string;
  email: string | null;
  role: "user" | "admin";
  created_at: string;
  nickname?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
};

/** Sole source of truth for who may be admin (env). Never trust DB role alone. */
function adminEmailsFromEnv(): string[] {
  const raw = process.env.ADMIN_EMAIL ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowlistedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmailsFromEnv().includes(email.trim().toLowerCase());
}

export async function getSessionUser() {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, role, created_at, nickname, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (data) {
    return data as Profile;
  }

  // Profile trigger may lag slightly after signup
  return {
    id: user.id,
    email: user.email ?? null,
    role: "user",
    created_at: user.created_at,
  };
}

/**
 * Admin access is email-allowlist only (`ADMIN_EMAIL`).
 * Other accounts stay regular users even if profiles.role was tampered with.
 */
export async function isAdminUser(): Promise<boolean> {
  const profile = await getProfile();
  if (!profile) return false;
  return isAllowlistedAdminEmail(profile.email);
}

/**
 * Promote the allowlisted admin profile role for RLS/admin RPCs.
 * Never promotes non-allowlisted emails.
 */
export async function ensureAdminRole(): Promise<boolean> {
  const profile = await getProfile();
  if (!profile || !isAllowlistedAdminEmail(profile.email)) {
    return false;
  }

  if (profile.role === "admin") return true;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", profile.id);

  // Even if the update is blocked, allowlist email still passes private.is_admin()
  return true;
}
