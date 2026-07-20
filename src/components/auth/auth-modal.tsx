"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Mode = "signin" | "signup";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
};

export function AuthModal({
  open,
  onClose,
  initialMode = "signin",
}: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setMessage(null);
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const title = useMemo(
    () => (mode === "signin" ? "Sign in" : "Create account"),
    [mode],
  );

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setError("Auth is not configured yet.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error: signError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signError) throw signError;
        onClose();
        window.location.reload();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        onClose();
        window.location.reload();
        return;
      }

      setMessage(
        "Account created. Check your email to confirm, then sign in.",
      );
      setMode("signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0a0c] shadow-[0_30px_80px_rgba(0,0,0,0.65)]"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,140,170,0.14), transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative px-6 pb-6 pt-7 sm:px-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-mute">
                Anikura
              </p>
              <h2
                id="auth-modal-title"
                className="mt-1 text-2xl tracking-[-0.03em] text-snow"
              >
                {title}
              </h2>
              <p className="mt-1.5 text-sm text-cloud">
                Save your place across devices. Quiet nights, same theater.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-cloud transition hover:bg-white/10 hover:text-snow"
              aria-label="Close dialog"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 1l12 12M13 1 1 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-xs text-mute">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-snow outline-none transition placeholder:text-mute focus:border-white/25 focus:bg-white/[0.06]"
                placeholder="you@email.com"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-mute">Password</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-snow outline-none transition placeholder:text-mute focus:border-white/25 focus:bg-white/[0.06]"
                placeholder="••••••••"
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
              className="flex w-full items-center justify-center rounded-full bg-snow px-4 py-2.5 text-sm font-medium text-void transition hover:bg-white disabled:opacity-60"
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
                  className="text-snow underline-offset-4 transition hover:underline"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setMessage(null);
                  }}
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-snow underline-offset-4 transition hover:underline"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setMessage(null);
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
