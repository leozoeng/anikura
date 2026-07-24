import { NextResponse } from "next/server";
import {
  createConfirmedAccount,
  isValidEmail,
  MIN_PASSWORD,
  normalizeEmail,
} from "@/lib/auth-server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Soft per-IP cap so the signup endpoint cannot be spammed. */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;

const hits = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function allowIp(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now >= row.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (row.count >= MAX_PER_WINDOW) return false;
  row.count += 1;
  return true;
}

function publicError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Create an account without sending a Supabase confirmation email.
 *
 * Built-in Supabase SMTP is capped at ~2 emails/hour project-wide, so the
 * default signUp → confirm-email path fails under real signup traffic.
 * Access is already gated by Discord membership after sign-in.
 */
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return publicError("Auth isn’t configured on this deploy yet.", 503);
  }

  const ip = clientIp(req);
  if (!allowIp(ip)) {
    return publicError(
      "Too many sign-up attempts from this network. Try again later.",
      429,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return publicError("Invalid request.", 400);
  }

  const email =
    typeof body === "object" &&
    body &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? normalizeEmail((body as { email: string }).email)
      : "";
  const password =
    typeof body === "object" &&
    body &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!isValidEmail(email)) {
    return publicError("Enter a valid email address.", 400);
  }
  if (password.length < MIN_PASSWORD) {
    return publicError(
      `Password must be at least ${MIN_PASSWORD} characters.`,
      400,
    );
  }

  const result = await createConfirmedAccount(email, password);
  if (!result.ok) {
    return publicError(result.error, result.status);
  }

  return NextResponse.json({ ok: true });
}
