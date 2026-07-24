import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/** Map auth / signup failures into short UI copy. */
export function formatAuthError(err: unknown, fallback = "Something went wrong.") {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : fallback;
  const lower = raw.toLowerCase();

  if (
    lower.includes("email rate limit") ||
    lower.includes("over_email_send_rate_limit") ||
    (lower.includes("rate limit") && lower.includes("email"))
  ) {
    return "Email sending is temporarily limited. Please try again in a few minutes.";
  }
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Incorrect email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Couldn’t finish signing in. Try again in a moment.";
  }

  return raw || fallback;
}

function isEmailNotConfirmed(err: AuthError | null) {
  if (!err) return false;
  const code = (err.code || "").toLowerCase();
  const msg = (err.message || "").toLowerCase();
  return (
    code === "email_not_confirmed" ||
    msg.includes("email not confirmed") ||
    msg.includes("email_not_confirmed")
  );
}

async function confirmStuckEmail(email: string, password: string) {
  const res = await fetch("/api/auth/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Could not confirm this account.");
  }
}

export async function signupWithPassword(email: string, password: string) {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    ok?: boolean;
  };

  if (!res.ok) {
    throw new Error(data.error || "Could not create account.");
  }

  return data;
}

/**
 * Sign in with password. If the account is stuck unconfirmed from the old
 * email flow, confirm it server-side and retry once.
 */
export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();
  const trimmed = email.trim();

  const first = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });
  if (!first.error) return first.data;

  if (!isEmailNotConfirmed(first.error)) {
    throw first.error;
  }

  await confirmStuckEmail(trimmed, password);

  const second = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });
  if (second.error) throw second.error;
  return second.data;
}
