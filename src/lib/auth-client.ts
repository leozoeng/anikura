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
    return "Confirm your email before signing in, or create a new account.";
  }

  return raw || fallback;
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
