"use server";

import { revalidatePath } from "next/cache";
import {
  ensureAdminRole,
  getSessionUser,
  isAdminUser,
  isAllowlistedAdminEmail,
} from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function requireAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const ok = await isAdminUser();
  if (!ok) throw new Error("Admin only");
  await ensureAdminRole();
}

function assertUuid(id: string, label = "id") {
  if (
    !id ||
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    throw new Error(`Invalid ${label}`);
  }
}

/**
 * Kick a live browser presence row and/or revoke Auth sessions for an account.
 * Guests: pass sessionId only. Signed-in: pass userId (and optional sessionId).
 */
export async function endUserSessions(input: {
  userId?: string | null;
  sessionId?: string | null;
}): Promise<{ ok: true; revokedAuth: boolean; clearedPresence: number }> {
  await requireAdmin();

  const userId = input.userId?.trim() || null;
  const sessionId = input.sessionId?.trim() || null;
  if (!userId && !sessionId) {
    throw new Error("Nothing to end");
  }
  if (userId) assertUuid(userId, "user id");

  const me = await getSessionUser();
  if (userId && me?.id === userId) {
    throw new Error("You can’t end your own admin session from here");
  }

  const service = createServiceClient();
  if (!service) {
    throw new Error("Service role key missing");
  }

  let clearedPresence = 0;

  if (sessionId) {
    const { error, count } = await service
      .from("presence")
      .delete({ count: "exact" })
      .eq("session_id", sessionId);
    if (error) throw new Error(error.message);
    clearedPresence += count ?? 0;
  }

  let revokedAuth = false;
  if (userId) {
    const supabase = await createClient();
    const { error: rpcError } = await supabase.rpc(
      "admin_revoke_auth_sessions",
      { p_user_id: userId },
    );
    if (rpcError) throw new Error(rpcError.message);
    revokedAuth = true;

    const { error, count } = await service
      .from("presence")
      .delete({ count: "exact" })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    clearedPresence += count ?? 0;
  }

  revalidatePath("/admin");
  return { ok: true, revokedAuth, clearedPresence };
}

/** Permanently delete an auth user (cascades profile). Cannot delete yourself or allowlisted admins. */
export async function deleteUserAccount(
  userId: string,
): Promise<{ ok: true }> {
  await requireAdmin();
  assertUuid(userId, "user id");

  const me = await getSessionUser();
  if (me?.id === userId) {
    throw new Error("You can’t delete your own account from admin");
  }

  const service = createServiceClient();
  if (!service) {
    throw new Error("Service role key missing");
  }

  const { data: profile } = await service
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .maybeSingle();

  if (isAllowlistedAdminEmail(profile?.email)) {
    throw new Error("Cannot delete an allowlisted admin account");
  }

  // Clear live desk first so the row disappears immediately.
  await service.from("presence").delete().eq("user_id", userId);

  // Best-effort session wipe before delete (deleteUser alone leaves JWTs until expiry).
  const supabase = await createClient();
  await supabase.rpc("admin_revoke_auth_sessions", { p_user_id: userId });

  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/profile");
  if (profile?.id) revalidatePath(`/u/${profile.id}`);

  return { ok: true };
}

/**
 * Clear Discord verification so the member must link + join + verify again.
 * Also revokes Auth sessions so the next visit hits the gate immediately.
 */
export async function revokeDiscordVerification(
  userId: string,
): Promise<{ ok: true }> {
  await requireAdmin();
  assertUuid(userId, "user id");

  const me = await getSessionUser();
  if (me?.id === userId) {
    throw new Error("You can’t revoke your own Discord verification from here");
  }

  const service = createServiceClient();
  if (!service) {
    throw new Error("Service role key missing");
  }

  const { data: profile } = await service
    .from("profiles")
    .select("id, email")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    throw new Error("User not found");
  }

  const { data: authData, error: getError } =
    await service.auth.admin.getUserById(userId);
  if (getError) throw new Error(getError.message);

  const existingMeta = (authData.user?.app_metadata ?? {}) as Record<
    string,
    unknown
  >;
  const nextMeta = { ...existingMeta };
  delete nextMeta.discord_verified;
  delete nextMeta.discord_id;
  delete nextMeta.discord_bypass;

  const { error: metaError } = await service.auth.admin.updateUserById(
    userId,
    { app_metadata: nextMeta },
  );
  if (metaError) throw new Error(metaError.message);

  const { error: profileError } = await service
    .from("profiles")
    .update({
      discord_id: null,
      discord_verified_at: null,
    })
    .eq("id", userId);
  if (profileError) throw new Error(profileError.message);

  const supabase = await createClient();
  await supabase.rpc("admin_revoke_auth_sessions", { p_user_id: userId });
  await service.from("presence").delete().eq("user_id", userId);

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Special-case: mark Discord verified without OAuth (already in server / stuck).
 */
export async function grantDiscordAccess(
  userId: string,
): Promise<{ ok: true }> {
  await requireAdmin();
  assertUuid(userId, "user id");

  const service = createServiceClient();
  if (!service) {
    throw new Error("Service role key missing");
  }

  const { data: authData, error: getError } =
    await service.auth.admin.getUserById(userId);
  if (getError) throw new Error(getError.message);
  if (!authData.user) throw new Error("User not found");

  const verifiedAt = new Date().toISOString();
  const { error: profileError } = await service
    .from("profiles")
    .update({ discord_verified_at: verifiedAt })
    .eq("id", userId);
  if (profileError) throw new Error(profileError.message);

  const { error: metaError } = await service.auth.admin.updateUserById(
    userId,
    {
      app_metadata: {
        ...(authData.user.app_metadata ?? {}),
        discord_verified: true,
        discord_bypass: true,
      },
    },
  );
  if (metaError) throw new Error(metaError.message);

  revalidatePath("/admin");
  return { ok: true };
}
