"use client";

import { useMemo, useState } from "react";
import { AnikuraMark } from "@/components/anikura-logo";
import { SafeImage } from "@/components/safe-image";
import {
  formatAuthError,
  signInWithPassword,
  signupWithPassword,
} from "@/lib/auth-client";
import { MOOD_ART } from "@/lib/genre-moods";

type Mode = "signin" | "signup";

const GATE_ART = MOOD_ART.romance ?? MOOD_ART.fantasy ?? Object.values(MOOD_ART)[0]!;

export function LoginForm({
  nextPath = "/",
  initialMode = "signin",
}: {
  nextPath?: string;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = useMemo(
    () =>
      mode === "signin"
        ? {
            title: "Welcome back",
            submit: "Enter Anikura",
            switchPrompt: "New here?",
            switchLabel: "Request access",
          }
        : {
            title: "Request access",
            submit: "Create account",
            switchPrompt: "Already a member?",
            switchLabel: "Sign in",
          },
    [mode],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const trimmed = email.trim();
      if (mode === "signup") {
        await signupWithPassword(trimmed, password);
      }
      await signInWithPassword(trimmed, password);
      window.location.assign(
        `/join-discord?next=${encodeURIComponent(nextPath)}`,
      );
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <div className="login-gate relative min-h-[100dvh] overflow-hidden bg-void">
      {/* Full-bleed cinematic plane */}
      <div className="absolute inset-0" aria-hidden>
        <SafeImage
          src={GATE_ART.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className={`login-gate-art object-cover ${GATE_ART.position ?? "object-center"}`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,transparent_0%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.82)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/55 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/90 via-void/40 to-transparent md:via-void/55" />
        <div className="login-gate-mist pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,140,170,0.18),transparent_70%)] blur-3xl" />
        <div className="login-gate-mist-slow pointer-events-none absolute bottom-10 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,179,199,0.12),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col justify-end gap-10 px-5 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-8 sm:pb-14 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16 lg:pb-16 lg:pt-16">
        {/* Brand reveal */}
        <div className="login-gate-copy max-w-xl pb-2 lg:pb-8">
          <div className="flex items-center gap-3">
            <AnikuraMark size={44} className="ring-1 ring-white/15" />
            <p className="font-jp text-[0.72rem] tracking-[0.28em] text-sakura-soft/90">
              アニクラ
            </p>
          </div>

          <h1 className="mt-5 text-[clamp(3.1rem,9vw,5.6rem)] font-semibold leading-[0.92] tracking-[-0.055em] text-snow">
            Anikura
          </h1>

          <p className="mt-5 max-w-md text-[clamp(1.05rem,2.4vw,1.35rem)] font-medium leading-snug tracking-[-0.03em] text-snow/92">
            A quiet theater for loud stories.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-cloud/90">
            Members only — create an account and join Discord to unlock
            watching.
          </p>

          <p className="mt-8 hidden text-[0.68rem] uppercase tracking-[0.18em] text-mute lg:block">
            Preview · {GATE_ART.credit}
          </p>
        </div>

        {/* Access form — interaction surface */}
        <div className="login-gate-panel w-full max-w-md self-stretch lg:self-end lg:justify-self-end">
          <div className="rounded-[1.4rem] border border-white/[0.12] bg-black/55 p-5 shadow-[0_40px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-6">
            <div
              role="tablist"
              aria-label="Account"
              className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-white/[0.1] bg-white/[0.03] p-1"
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

            <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-snow">
              {copy.title}
            </h2>
            <p className="mt-1.5 text-sm text-mute">
              {mode === "signup"
                ? "Takes a minute. Discord unlocks the rest."
                : "Continue to Discord verification."}
            </p>

            <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
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
                  placeholder="you@email.com"
                  className="w-full rounded-xl border border-white/[0.12] bg-white/[0.04] px-3.5 py-3 text-sm text-snow outline-none transition placeholder:text-mute/70 focus:border-sakura/45 focus:bg-white/[0.06]"
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
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/[0.12] bg-white/[0.04] py-3 pl-3.5 pr-14 text-sm text-snow outline-none transition placeholder:text-mute/70 focus:border-sakura/45 focus:bg-white/[0.06]"
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

              <button
                type="submit"
                disabled={busy}
                className="mt-1 flex w-full items-center justify-center rounded-full bg-snow px-4 py-3.5 text-sm font-semibold tracking-[-0.02em] text-[#0a0a0c] transition duration-300 hover:bg-white disabled:opacity-60"
              >
                {busy ? "Please wait…" : copy.submit}
              </button>
            </form>

            <p className="mt-5 text-center text-[0.8rem] text-mute">
              {copy.switchPrompt}{" "}
              <button
                type="button"
                className="font-medium text-snow underline-offset-4 transition hover:underline"
                onClick={() =>
                  switchMode(mode === "signin" ? "signup" : "signin")
                }
              >
                {copy.switchLabel}
              </button>
            </p>
          </div>

          <p className="mt-4 text-center text-[0.68rem] uppercase tracking-[0.16em] text-mute/80 lg:hidden">
            Preview · {GATE_ART.credit}
          </p>
        </div>
      </div>
    </div>
  );
}
