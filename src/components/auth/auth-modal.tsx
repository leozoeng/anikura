"use client";

import { SafeImage } from "@/components/safe-image";
import { useEffect, useMemo, useState } from "react";
import { AnikuraMark } from "@/components/anikura-logo";
import { MOOD_ART } from "@/lib/genre-moods";
import {
  formatAuthError,
  signInWithPassword,
  signupWithPassword,
} from "@/lib/auth-client";
import { isSupabaseConfigured } from "@/lib/supabase/env";


type Mode = "signin" | "signup";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
  configured?: boolean;
};

const BACKDROPS = Object.values(MOOD_ART);

function pickBackdrop(seed: number) {
  return BACKDROPS[seed % BACKDROPS.length]!;
}

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
  const [artSeed, setArtSeed] = useState(0);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setMessage(null);
      setShowPassword(false);
      setArtSeed(Math.floor(Math.random() * BACKDROPS.length));
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

  const art = useMemo(() => pickBackdrop(artSeed), [artSeed]);

  const copy = useMemo(
    () =>
      mode === "signin"
        ? { title: "Sign in", submit: "Sign in" }
        : { title: "Create account", submit: "Create account" },
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
      const trimmed = email.trim();
      if (mode === "signup") {
        await signupWithPassword(trimmed, password);
      }
      await signInWithPassword(trimmed, password);
      onClose();
      window.location.assign("/join-discord");
    } catch (err) {
      setError(formatAuthError(err));
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 animate-rise">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative grid w-full max-w-[52rem] overflow-hidden rounded-[1.35rem] border border-white/[0.12] bg-[#080809] shadow-[0_40px_120px_rgba(0,0,0,0.8)] md:grid-cols-[1.05fr_1fr]"
      >
        {/* Anime panel */}
        <div className="relative min-h-[9.5rem] overflow-hidden md:min-h-full">
          <SafeImage
            key={art.src}
            src={art.src}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 28rem"
            className={`object-cover ${art.position ?? "object-center"}`}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[#080809] via-black/45 to-black/25 md:bg-gradient-to-r md:from-transparent md:via-black/35 md:to-[#080809]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,transparent_35%,rgba(0,0,0,0.55)_100%)]"
          />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 md:inset-auto md:bottom-0 md:left-0 md:right-0 md:p-6">
            <div className="flex items-center gap-2.5">
              <AnikuraMark size={36} className="ring-1 ring-white/20" />
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-snow">
                  Anikura
                </p>
                <p className="mt-0.5 text-[0.72rem] text-white/55">{art.credit}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="relative flex flex-col px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-cloud transition hover:bg-white/10 hover:text-snow sm:right-4 sm:top-4"
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

          <div
            role="tablist"
            aria-label="Account"
            className="mb-6 grid w-full max-w-[16rem] grid-cols-2 gap-1 rounded-full border border-white/[0.1] bg-white/[0.03] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              onClick={() => switchMode("signin")}
              className={`rounded-full px-3 py-2 text-[0.8rem] tracking-[-0.01em] transition duration-300 ${
                mode === "signin"
                  ? "bg-white font-medium text-[#0a0a0c]"
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
              className={`rounded-full px-3 py-2 text-[0.8rem] tracking-[-0.01em] transition duration-300 ${
                mode === "signup"
                  ? "bg-white font-medium text-[#0a0a0c]"
                  : "text-mute hover:text-cloud"
              }`}
            >
              Create
            </button>
          </div>

          <h2
            id="auth-modal-title"
            className="mb-5 text-[1.75rem] font-semibold leading-none tracking-[-0.045em] text-snow sm:text-[1.9rem]"
          >
            {copy.title}
          </h2>

          <form onSubmit={onSubmit} className="flex flex-1 flex-col space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[0.7rem] font-medium tracking-[0.08em] text-mute">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/[0.12] bg-white/[0.03] px-3.5 py-3 text-sm text-snow outline-none transition placeholder:text-mute/70 focus:border-white/40 focus:bg-white/[0.05]"
                placeholder="you@email.com"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.7rem] font-medium tracking-[0.08em] text-mute">
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
                  className="w-full rounded-xl border border-white/[0.12] bg-white/[0.03] py-3 pl-3.5 pr-14 text-sm text-snow outline-none transition placeholder:text-mute/70 focus:border-white/40 focus:bg-white/[0.05]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-[0.7rem] font-medium text-mute transition hover:bg-white/[0.06] hover:text-snow"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
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
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-snow px-4 py-3.5 text-sm font-semibold tracking-[-0.02em] text-[#0a0a0c] transition duration-300 hover:bg-white disabled:opacity-60"
            >
              {busy ? "Please wait…" : copy.submit}
            </button>
          </form>

          <p className="mt-5 text-[0.8rem] text-mute">
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
                Have an account?{" "}
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
