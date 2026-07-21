"use client";

import { useEffect, useMemo, useState } from "react";
import { AnikuraMark } from "@/components/anikura-logo";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Mode = "signin" | "signup";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
  configured?: boolean;
};

export function AuthModal({
  open,
  onClose,
  initialMode = "signin",
  configured,
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

  const copy = useMemo(
    () =>
      mode === "signin"
        ? {
            title: "Welcome back",
            subtitle: "Pick up where you left off — same quiet theater.",
            submit: "Sign in",
          }
        : {
            title: "Take a seat",
            subtitle: "Save your place across devices. Soft nights, same story.",
            submit: "Create account",
          },
    [mode],
  );

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!(configured ?? isSupabaseConfigured())) {
      setError(
        "Auth isn’t live on this deploy yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy.",
      );
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

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setMessage(null);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/78 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="auth-modal relative w-full max-w-[26rem] overflow-hidden rounded-[1.35rem] border border-white/[0.1] bg-[#09090b] shadow-[0_40px_100px_rgba(0,0,0,0.72)]"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,140,170,0.2),transparent_68%)]" />
          <div className="absolute -left-8 top-16 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,179,199,0.12),transparent_70%)] blur-2xl" />
          <div className="absolute -right-6 bottom-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_70%)] blur-2xl" />
          <span className="footer-petal absolute right-10 top-14 text-sm text-[#ffb3c7]/40">
            ✿
          </span>
          <span className="footer-petal-slow absolute left-8 top-24 text-[0.7rem] text-[#ff8caa]/30">
            ✿
          </span>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb3c7]/45 to-transparent" />
        </div>

        <div className="relative px-5 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <AnikuraMark size={34} className="ring-1 ring-white/10" />
              <div className="min-w-0">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-[#ffb3c7]/80">
                  Anikura
                </p>
                <p className="mt-0.5 text-[0.7rem] tracking-[-0.01em] text-mute">
                  Quiet theater
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-cloud transition hover:bg-white/10 hover:text-snow"
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

          <div
            role="tablist"
            aria-label="Account"
            className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              onClick={() => switchMode("signin")}
              className={`rounded-full px-3 py-2 text-[0.8125rem] tracking-[-0.01em] transition duration-300 ${
                mode === "signin"
                  ? "bg-white/[0.1] text-snow shadow-[inset_0_0_0_1px_rgba(255,140,170,0.28)]"
                  : "text-mute hover:text-cloud"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => switchMode("signup")}
              className={`rounded-full px-3 py-2 text-[0.8125rem] tracking-[-0.01em] transition duration-300 ${
                mode === "signup"
                  ? "bg-white/[0.1] text-snow shadow-[inset_0_0_0_1px_rgba(255,140,170,0.28)]"
                  : "text-mute hover:text-cloud"
              }`}
            >
              Create account
            </button>
          </div>

          <div className="mb-5">
            <h2
              id="auth-modal-title"
              className="text-[1.55rem] font-semibold leading-tight tracking-[-0.04em] text-snow"
            >
              {copy.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-cloud/90">
              {copy.subtitle}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-[0.7rem] font-medium tracking-[0.04em] text-mute">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-field w-full rounded-xl border border-white/[0.1] bg-white/[0.035] px-3.5 py-2.5 text-sm text-snow outline-none transition placeholder:text-mute/80 focus:border-[#ff8caa]/45 focus:bg-white/[0.055] focus:shadow-[0_0_0_3px_rgba(255,140,170,0.12)]"
                placeholder="you@email.com"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[0.7rem] font-medium tracking-[0.04em] text-mute">
                Password
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-field w-full rounded-xl border border-white/[0.1] bg-white/[0.035] px-3.5 py-2.5 text-sm text-snow outline-none transition placeholder:text-mute/80 focus:border-[#ff8caa]/45 focus:bg-white/[0.055] focus:shadow-[0_0_0_3px_rgba(255,140,170,0.12)]"
                placeholder="••••••••"
              />
            </label>

            {error ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-xl border border-[#ff8caa]/25 bg-[#ff8caa]/08 px-3 py-2 text-sm text-sakura-mist">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="group mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-white/[0.1] px-4 py-3 text-sm font-semibold tracking-[-0.02em] text-snow shadow-[inset_0_0_0_1px_rgba(255,140,170,0.3)] transition duration-300 hover:bg-white/[0.15] hover:shadow-[inset_0_0_0_1px_rgba(255,140,170,0.45)] disabled:opacity-60"
            >
              {busy ? "Please wait…" : copy.submit}
              {!busy ? (
                <span
                  aria-hidden
                  className="text-mute transition duration-300 group-hover:translate-x-0.5 group-hover:text-sakura-soft"
                >
                  →
                </span>
              ) : null}
            </button>
          </form>

          <p className="mt-5 text-center text-[0.8rem] text-mute">
            {mode === "signin" ? (
              <>
                New to the theater?{" "}
                <button
                  type="button"
                  className="font-medium text-sakura-soft underline-offset-4 transition hover:text-sakura-mist hover:underline"
                  onClick={() => switchMode("signup")}
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have a seat?{" "}
                <button
                  type="button"
                  className="font-medium text-sakura-soft underline-offset-4 transition hover:text-sakura-mist hover:underline"
                  onClick={() => switchMode("signin")}
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
