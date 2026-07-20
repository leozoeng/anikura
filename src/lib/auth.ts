import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type Profile = {
  id: string;
  email: string | null;
  role: "user" | "admin";
  created_at: string;
};

function adminEmailsFromEnv(): string[] {
  const raw = process.env.ADMIN_EMAIL ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
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
    .select("id, email, role, created_at")
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

export async function isAdminUser(): Promise<boolean> {
  const profile = await getProfile();
  if (!profile) return false;

  if (profile.role === "admin") return true;

  const email = profile.email?.toLowerCase();
  if (email && adminEmailsFromEnv().includes(email)) {
    return true;
  }

  return false;
}

/**
 * If the signed-in user is an env allowlisted admin but still role=user,
 * promote them once so RLS/admin RPCs succeed.
 */
export async function ensureAdminRole(): Promise<boolean> {
  if (!(await isAdminUser())) return false;

  const profile = await getProfile();
  if (!profile) return false;
  if (profile.role === "admin") return true;

  const email = profile.email?.toLowerCase();
  if (!email || !adminEmailsFromEnv().includes(email)) {
    // Allowlist-only admins still pass isAdminUser via DB allowlist RPC path
    return true;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", profile.id);

  // Role change is blocked for non-admins by trigger; allowlist users
  // already pass private.is_admin() via private.admin_allowlist.
  if (error) {
    return true;
  }
  return true;
}
