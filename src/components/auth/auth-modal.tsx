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

const PERKS = [
  { label: "Continue watching", hint: "Pick up mid-episode" },
  { label: "Your lists", hint: "Watching · finished · dropped" },
  { label: "Synced seats", hint: "Same place on any device" },
] as const;

export function AuthModal({
  open,
  onClose,
  initialMode = "signin",
  configured,
}: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setMessage(null);
      setShowPassword(false);
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
            subtitle: "Slip back into your seat — progress waiting.",
            submit: "Sign in",
          }
        : {
            title: "Make it yours",
            subtitle: "A quiet seat with your lists and continue strip.",
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-rise">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-[27rem] overflow-hidden rounded-[1.4rem] border border-white/[0.1] bg-[#0a0a0c] shadow-[0_40px_110px_rgba(0,0,0,0.75)]"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(255,255,255,0.12),transparent_65%)]" />
          <div className="absolute -left-10 top-24 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.04),transparent_70%)] blur-2xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        </div>

        <div className="relative px-5 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <AnikuraMark size={36} className="ring-1 ring-white/12" />
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-snow/90">
                  Anikura
                </p>
                <p className="mt-0.5 text-[0.72rem] tracking-[-0.01em] text-mute">
                  Quiet theater · your seat
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
            className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-white/[0.08] bg-black/30 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              onClick={() => switchMode("signin")}
              className={`rounded-full px-3 py-2 text-[0.8125rem] tracking-[-0.01em] transition duration-300 ${
                mode === "signin"
                  ? "bg-white text-[#0a0a0c] shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
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
                  ? "bg-white text-[#0a0a0c] shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
                  : "text-mute hover:text-cloud"
              }`}
            >
              Create account
            </button>
          </div>

          <div className="mb-4">
            <h2
              id="auth-modal-title"
              className="text-[1.55rem] font-semibold leading-tight tracking-[-0.04em] text-snow"
            >
              {copy.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-cloud/85">
              {copy.subtitle}
            </p>
          </div>

          <ul className="mb-5 grid gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            {PERKS.map((perk) => (
              <li
                key={perk.label}
                className="flex items-start gap-2.5 text-sm leading-snug"
              >
                <span
                  aria-hidden
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[0.65rem] text-snow ring-1 ring-white/12"
                >
                  ✓
                </span>
                <span>
                  <span className="font-medium tracking-[-0.02em] text-snow">
                    {perk.label}
                  </span>
                  <span className="text-mute"> — {perk.hint}</span>
                </span>
              </li>
            ))}
          </ul>

          <form onSubmit={onSubmit} className="space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-[0.7rem] font-medium tracking-[0.06em] text-mute">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.035] px-3.5 py-2.5 text-sm text-snow outline-none transition placeholder:text-mute/75 focus:border-white/35 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
                placeholder="you@email.com"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.7rem] font-medium tracking-[0.06em] text-mute">
                Password
              </span>
              <span className="relative block">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.035] py-2.5 pl-3.5 pr-12 text-sm text-snow outline-none transition placeholder:text-mute/75 focus:border-white/35 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[0.68rem] font-medium text-mute transition hover:bg-white/[0.06] hover:text-snow"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
              {mode === "signup" ? (
                <span className="mt-1.5 block text-[0.68rem] text-mute">
                  At least 6 characters.
                </span>
              ) : null}
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
              className="group mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-snow px-4 py-3 text-sm font-semibold tracking-[-0.02em] text-[#0a0a0c] transition duration-300 hover:bg-white disabled:opacity-60"
            >
              {busy ? "Please wait…" : copy.submit}
              {!busy ? (
                <span
                  aria-hidden
                  className="text-black/35 transition duration-300 group-hover:translate-x-0.5 group-hover:text-black/55"
                >
                  →
                </span>
              ) : null}
            </button>
          </form>

          <p className="mt-5 text-center text-[0.8rem] text-mute">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  className="font-medium text-snow underline-offset-4 transition hover:underline"
                  onClick={() => switchMode("signup")}
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-snow underline-offset-4 transition hover:underline"
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
