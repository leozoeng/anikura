"use server";

import { revalidatePath } from "next/cache";
import { ensureAdminRole, isAdminUser } from "@/lib/auth";
import {
  PROFILE_BADGE_ORDER,
  type ProfileBadgeId,
} from "@/lib/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AdminBadgeUser = {
  id: string;
  email: string | null;
  username: string | null;
  nickname: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  badges: ProfileBadgeId[];
  created_at: string;
};

function isKnownBadge(value: string): value is ProfileBadgeId {
  return (
    value === "dev" ||
    value === "vip" ||
    value === "og" ||
    value === "partner"
  );
}

function normalizeBadges(raw: unknown): ProfileBadgeId[] {
  if (!Array.isArray(raw)) return [];
  const set = new Set<ProfileBadgeId>();
  for (const item of raw) {
    const id = String(item).trim().toLowerCase();
    if (isKnownBadge(id)) set.add(id);
  }
  return PROFILE_BADGE_ORDER.filter((id) => set.has(id));
}

function mapRow(row: Record<string, unknown>): AdminBadgeUser {
  return {
    id: String(row.id),
    email: (row.email as string | null) ?? null,
    username: (row.username as string | null) ?? null,
    nickname: (row.nickname as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    role: row.role === "admin" ? "admin" : "user",
    badges: normalizeBadges(row.badges),
    created_at: String(row.created_at ?? ""),
  };
}

async function requireAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const ok = await isAdminUser();
  if (!ok) throw new Error("Admin only");
  await ensureAdminRole();
}

export async function searchProfilesForBadges(
  query: string,
): Promise<AdminBadgeUser[]> {
  await requireAdmin();
  const q = query.trim();
  if (q.length < 1) return [];

  const supabase = await createClient();
  const safe = q.replace(/[%_,.()]/g, " ").trim();
  if (!safe) return [];
  const pattern = `%${safe}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, nickname, avatar_url, role, badges, created_at")
    .or(`email.ilike."${pattern}",nickname.ilike."${pattern}",username.ilike."${pattern}"`)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function listBadgedProfiles(): Promise<AdminBadgeUser[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, nickname, avatar_url, role, badges, created_at")
    .or("badges.cs.{dev},badges.cs.{vip},badges.cs.{og},badges.cs.{partner}")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function listRecentSignups(
  limit = 40,
): Promise<AdminBadgeUser[]> {
  await requireAdmin();
  const supabase = await createClient();
  const take = Math.min(Math.max(limit, 1), 100);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, nickname, avatar_url, role, badges, created_at")
    .order("created_at", { ascending: false })
    .limit(take);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function setProfileBadges(
  userId: string,
  badges: ProfileBadgeId[],
): Promise<AdminBadgeUser> {
  await requireAdmin();

  if (!userId || typeof userId !== "string") {
    throw new Error("Invalid user");
  }

  const next = PROFILE_BADGE_ORDER.filter((id) => badges.includes(id));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ badges: next })
    .eq("id", userId)
    .select("id, email, username, nickname, avatar_url, role, badges, created_at")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("User not found");

  revalidatePath("/admin");
  revalidatePath("/profile");
  revalidatePath(`/u/${userId}`);
  const handle = (data.username as string | null)?.trim();
  if (handle) revalidatePath(`/@${handle}`);

  return mapRow(data as Record<string, unknown>);
}
