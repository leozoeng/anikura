"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ nextPath = "/" }: { nextPath?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        window.location.assign(nextPath);
        return;
      }

      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (err) throw err;

      if (data.session) {
        window.location.assign(nextPath);
        return;
      }

      setMessage("Account created. Confirm your email, then sign in.");
      setMode("signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.1] bg-[#0a0a0c] p-6 sm:p-8">
      <p className="text-[0.7rem] uppercase tracking-[0.18em] text-mute">
        Anikura
      </p>
      <h1 className="mt-1 text-3xl tracking-[-0.03em] text-snow">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-2 text-sm text-cloud">
        Email and password — simple, for saving your place later.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3.5">
        <label className="block">
          <span className="mb-1.5 block text-xs text-mute">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-snow outline-none focus:border-white/25"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-mute">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-snow outline-none focus:border-white/25"
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-sm text-cloud">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-snow py-2.5 text-sm font-medium text-void transition hover:bg-white disabled:opacity-60"
        >
          {busy
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-mute">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <button
              type="button"
              className="text-snow hover:underline"
              onClick={() => setMode("signup")}
            >
              Create account
            </button>
          </>
        ) : (
          <>
            Have an account?{" "}
            <button
              type="button"
              className="text-snow hover:underline"
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
          </>
        )}
      </p>

      <p className="mt-4 text-center text-xs text-mute">
        <Link href="/" className="hover:text-cloud">
          ← Back home
        </Link>
      </p>
    </div>
  );
}
