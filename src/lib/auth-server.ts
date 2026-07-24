import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 6;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return EMAIL_RE.test(email);
}

export function isEmailNotConfirmedError(err: { message?: string; code?: string } | null) {
  if (!err) return false;
  const code = (err.code || "").toLowerCase();
  const msg = (err.message || "").toLowerCase();
  return (
    code === "email_not_confirmed" ||
    msg.includes("email not confirmed") ||
    msg.includes("email_not_confirmed")
  );
}

export function isAlreadyRegisteredError(err: {
  message?: string;
  status?: number;
  code?: string;
} | null) {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const code = (err.code || "").toLowerCase();
  return (
    err.status === 422 ||
    code.includes("already") ||
    msg.includes("already") ||
    msg.includes("registered") ||
    msg.includes("exists")
  );
}

/** Stateless anon client for password checks (no cookies / no browser session). */
function createAnonAuthClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Look up a user id by email without sending mail (admin generateLink). */
async function findUserIdByEmail(email: string): Promise<string | null> {
  const service = createServiceClient();
  if (!service) return null;

  const { data, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data.user?.id) return null;
  return data.user.id;
}

/**
 * Confirm email for an existing account after verifying the password.
 * Used for people stuck from the old confirm-email signup path.
 */
export async function confirmEmailIfPasswordMatches(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const service = createServiceClient();
  const anon = createAnonAuthClient();
  if (!service || !anon) {
    return { ok: false, error: "Sign-in is temporarily unavailable.", status: 503 };
  }

  const { data: signData, error: signError } = await anon.auth.signInWithPassword({
    email,
    password,
  });

  // Already confirmed and password ok — nothing to fix.
  if (!signError && signData.user) {
    await anon.auth.signOut().catch(() => undefined);
    return { ok: true };
  }

  if (!isEmailNotConfirmedError(signError)) {
    return {
      ok: false,
      error: "Incorrect email or password.",
      status: 401,
    };
  }

  const userId = await findUserIdByEmail(email);
  if (!userId) {
    return { ok: false, error: "Could not confirm this account.", status: 400 };
  }

  const { error: updateError } = await service.auth.admin.updateUserById(
    userId,
    { email_confirm: true },
  );
  if (updateError) {
    return {
      ok: false,
      error: updateError.message || "Could not confirm this account.",
      status: 400,
    };
  }

  return { ok: true };
}

/**
 * Create a confirmed account (no confirmation email).
 * If the email already exists but is unconfirmed, confirm it when the
 * password matches so those users can get in.
 */
export async function createConfirmedAccount(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const service = createServiceClient();
  if (!service) {
    return { ok: false, error: "Sign-up is temporarily unavailable.", status: 503 };
  }

  const { error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (!error) return { ok: true };

  if (isAlreadyRegisteredError(error)) {
    const confirmed = await confirmEmailIfPasswordMatches(email, password);
    if (confirmed.ok) {
      // Password matched (and we confirmed if needed). Treat as success so
      // the client can sign in — covers retries + stuck unconfirmed accounts.
      return { ok: true };
    }
    if (confirmed.status === 401) {
      return {
        ok: false,
        error: "An account with this email already exists. Sign in instead.",
        status: 409,
      };
    }
    return confirmed;
  }

  const msg = (error.message || "").toLowerCase();
  if (msg.includes("rate") || msg.includes("email rate")) {
    return {
      ok: false,
      error: "Sign-up is busy right now. Please try again in a few minutes.",
      status: 429,
    };
  }

  return {
    ok: false,
    error: error.message || "Could not create account.",
    status: 400,
  };
}
