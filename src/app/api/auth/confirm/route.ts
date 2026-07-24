import { NextResponse } from "next/server";
import {
  confirmEmailIfPasswordMatches,
  isValidEmail,
  MIN_PASSWORD,
  normalizeEmail,
} from "@/lib/auth-server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Confirm email for accounts stuck from the old confirmation flow.
 * Requires the correct password (verified via Auth before confirming).
 */
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Auth isn’t configured on this deploy yet." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
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

  if (!isValidEmail(email) || password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 400 },
    );
  }

  const result = await confirmEmailIfPasswordMatches(email, password);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true });
}
