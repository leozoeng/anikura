"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnikuraMark } from "@/components/anikura-logo";
import { SafeImage } from "@/components/safe-image";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/site-url";
import { MOOD_ART } from "@/lib/genre-moods";

const GATE_ART = MOOD_ART.fantasy ?? MOOD_ART.romance ?? Object.values(MOOD_ART)[0]!;

export function JoinDiscordClient({
  nextPath = "/",
  inviteUrl,
  discordLinked,
  gateConfigured,
}: {
  nextPath?: string;
  inviteUrl: string;
  discordLinked: boolean;
  gateConfigured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<
    "link" | "verify" | "unlink" | "signout" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(discordLinked);

  async function linkDiscord() {
    setBusy("link");
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.linkIdentity({
        provider: "discord",
        options: {
          redirectTo: getAuthCallbackUrl(
            `/join-discord?next=${encodeURIComponent(nextPath)}`,
          ),
          scopes: "identify",
        },
      });
      if (err) throw err;
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Could not open Discord.";
      const lower = raw.toLowerCase();
      if (lower.includes("manual linking")) {
        setError(
          "Discord linking is turned off in Supabase. Open Authentication → Providers → enable “Allow manual linking”, then try again.",
        );
      } else {
        setError(raw);
      }
      setBusy(null);
    }
  }

  async function unlinkDiscord() {
    setBusy("unlink");
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: idError } = await supabase.auth.getUserIdentities();
      if (idError) throw idError;

      const discord = data?.identities?.find((i) => i.provider === "discord");
      if (!discord) {
        setLinked(false);
        return;
      }

      const { error: unlinkError } =
        await supabase.auth.unlinkIdentity(discord);
      if (unlinkError) throw unlinkError;

      setLinked(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not unlink Discord. Try signing out.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function signOut() {
    setBusy("signout");
    setError(null);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.assign("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign out.");
      setBusy(null);
    }
  }

  async function verifyMembership() {
    setBusy("verify");
    setError(null);
    try {
      const res = await fetch("/api/discord/verify", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        if (json.error === "discord_not_linked") {
          setLinked(false);
        }
        throw new Error(
          json.message ||
            (json.error === "not_in_server"
              ? "Join the Discord server first, then try again."
              : json.error || "Verification failed."),
        );
      }

      const supabase = createClient();
      await supabase.auth.refreshSession();
      try {
        sessionStorage.setItem("anikura_discord_gate_ok", "1");
      } catch {
        /* private mode */
      }
      router.replace(nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setBusy(null);
    }
  }

  if (!gateConfigured) {
    return (
      <div className="login-gate relative flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-void px-5 py-10">
        <div className="relative z-10 w-full max-w-lg rounded-[1.4rem] border border-amber-500/25 bg-black/70 p-6 shadow-[0_40px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
          <p className="text-[0.7rem] uppercase tracking-[0.18em] text-amber-200/80">
            Setup needed
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-snow">
            Discord gate isn&apos;t live yet
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-cloud">
            Add <code className="text-snow">DISCORD_GUILD_ID</code> and{" "}
            <code className="text-snow">DISCORD_BOT_TOKEN</code> on Vercel
            Production, then Redeploy.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={nextPath.startsWith("/") ? nextPath : "/"}
              className="min-h-11 rounded-full bg-snow px-4 py-2.5 text-sm font-medium text-void"
            >
              Continue for now
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={busy !== null}
              className="min-h-11 rounded-full border border-white/20 px-4 py-2.5 text-sm font-medium text-snow disabled:opacity-60"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-gate relative min-h-[100dvh] overflow-y-auto overflow-x-hidden bg-void">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <SafeImage
          src={GATE_ART.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className={`login-gate-art object-cover ${GATE_ART.position ?? "object-center"}`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_35%,transparent_0%,rgba(0,0,0,0.4)_55%,rgba(0,0,0,0.85)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/85 via-void/45 to-transparent" />
        <div className="login-gate-mist absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(126,184,255,0.14),transparent_70%)] blur-3xl" />
      </div>

      {/* Always-visible escape on mobile */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/[0.08] bg-black/55 px-4 py-3 backdrop-blur-xl pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <AnikuraMark size={28} className="ring-1 ring-white/15" />
          <span className="truncate text-sm font-medium tracking-[-0.02em] text-snow">
            Anikura
          </span>
        </div>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void signOut()}
          className="min-h-10 shrink-0 rounded-full border border-white/20 bg-white/[0.06] px-3.5 text-sm font-medium text-snow transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy === "signout" ? "…" : "Sign out"}
        </button>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pb-14 lg:min-h-[100dvh] lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16 lg:pb-16 lg:pt-16">
        <div className="login-gate-copy max-w-xl lg:pb-8">
          <div className="hidden items-center gap-3 lg:flex">
            <AnikuraMark size={44} className="ring-1 ring-white/15" />
            <p className="font-jp text-[0.72rem] tracking-[0.28em] text-sakura-soft/90">
              アニクラ
            </p>
          </div>
          <h1 className="text-[clamp(2.1rem,8vw,4.4rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-snow lg:mt-5">
            One more step
          </h1>
          <p className="mt-3 max-w-md text-[clamp(0.95rem,2.2vw,1.2rem)] font-medium leading-snug tracking-[-0.02em] text-snow/90">
            Link Discord and join the server to open the theater.
          </p>
          <p className="mt-2 hidden max-w-sm text-sm leading-relaxed text-cloud/90 sm:block">
            This keeps Anikura for people who show up — not drive-by guests.
          </p>
        </div>

        <div className="login-gate-panel w-full max-w-md self-stretch lg:self-end lg:justify-self-end">
          <div className="rounded-[1.4rem] border border-white/[0.12] bg-black/55 p-5 shadow-[0_40px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-6">
            <div className="mb-1 hidden justify-end lg:flex">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void signOut()}
                className="min-h-9 rounded-full border border-white/15 px-3 text-xs font-medium text-cloud transition hover:border-white/30 hover:text-snow disabled:opacity-60"
              >
                {busy === "signout" ? "Signing out…" : "Sign out"}
              </button>
            </div>

            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-mute">
              Required
            </p>
            <h2 className="mt-1 text-[1.45rem] font-semibold tracking-[-0.04em] text-snow sm:text-[1.55rem]">
              Join Discord
            </h2>

            <ol className="mt-5 space-y-5">
              <li className="flex gap-3.5 sm:gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-sm font-medium text-snow">
                  1
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-snow">Link Discord</p>
                  <p className="mt-1 text-sm text-mute">
                    Use the Discord account that&apos;s in the Anikura server.
                  </p>
                  {linked ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-emerald-300/90">
                        Discord linked.
                      </p>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void unlinkDiscord()}
                        className="flex min-h-11 w-full items-center justify-center rounded-full border border-amber-400/35 bg-amber-400/10 px-4 text-sm font-medium text-amber-100 transition active:scale-[0.98] disabled:opacity-60"
                      >
                        {busy === "unlink"
                          ? "Unlinking…"
                          : "Wrong Discord — unlink & retry"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void linkDiscord()}
                      className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full bg-[#5865F2] px-4 text-sm font-medium text-white transition active:scale-[0.98] hover:bg-[#4752c4] disabled:opacity-60 sm:w-auto"
                    >
                      {busy === "link" ? "Opening Discord…" : "Link Discord"}
                    </button>
                  )}
                </div>
              </li>

              <li className="flex gap-3.5 sm:gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-sm font-medium text-snow">
                  2
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-snow">Join the server</p>
                  <p className="mt-1 text-sm text-mute">
                    Open the invite and accept membership.
                  </p>
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full border border-white/20 px-4 text-sm font-medium text-snow transition active:scale-[0.98] hover:border-white/35 hover:bg-white/[0.06] sm:inline-flex sm:w-auto"
                  >
                    Open Discord invite
                  </a>
                </div>
              </li>

              <li className="flex gap-3.5 sm:gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-sm font-medium text-snow">
                  3
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-snow">
                    Verify membership
                  </p>
                  <p className="mt-1 text-sm text-mute">
                    We check that your linked Discord is in the Anikura server.
                  </p>
                  <button
                    type="button"
                    disabled={busy !== null || !linked}
                    onClick={() => void verifyMembership()}
                    className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full bg-snow px-4 text-sm font-medium text-void transition active:scale-[0.98] hover:bg-white disabled:opacity-50 sm:w-auto"
                  >
                    {busy === "verify" ? "Checking…" : "I’ve joined — verify"}
                  </button>
                </div>
              </li>
            </ol>

            {error ? (
              <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <p className="mt-6 text-center text-xs leading-relaxed text-mute">
              Wrong Discord on your phone? Tap{" "}
              <span className="text-cloud">Wrong Discord — unlink</span>, then
              link your main account. Or use{" "}
              <span className="text-cloud">Sign out</span> at the top.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
