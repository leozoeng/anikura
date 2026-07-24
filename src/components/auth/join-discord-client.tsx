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
  const [busy, setBusy] = useState<"link" | "verify" | null>(null);
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
      setError(err instanceof Error ? err.message : "Could not open Discord.");
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
              ? "Join the Discord server first, then verify again."
              : json.error || "Verification failed."),
        );
      }

      const supabase = createClient();
      await supabase.auth.refreshSession();
      router.replace(nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setBusy(null);
    }
  }

  if (!gateConfigured) {
    return (
      <div className="login-gate relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-void px-5">
        <div className="relative z-10 w-full max-w-lg rounded-[1.4rem] border border-amber-500/25 bg-black/70 p-6 shadow-[0_40px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
          <p className="text-[0.7rem] uppercase tracking-[0.18em] text-amber-200/80">
            Setup needed
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-snow">
            Discord gate isn&apos;t live yet
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-cloud">
            The site code is ready. Add these on Vercel → Settings → Environment
            Variables for <span className="text-snow">Production</span>, then
            Redeploy:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-amber-100/95">
            <li>
              <code className="text-snow">DISCORD_GUILD_ID</code> — your server
              ID
            </li>
            <li>
              <code className="text-snow">DISCORD_BOT_TOKEN</code> — bot token
              (Server Members Intent on)
            </li>
          </ul>
          <p className="mt-4 text-sm text-mute">
            Also enable Discord under Supabase → Authentication → Providers.
            After redeploy, sign in again and you&apos;ll see Link Discord.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={nextPath.startsWith("/") ? nextPath : "/"}
              className="rounded-full bg-snow px-4 py-2.5 text-sm font-medium text-void"
            >
              Continue for now
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-4 py-2.5 text-sm font-medium text-snow"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-gate relative min-h-[100dvh] overflow-hidden bg-void">
      <div className="absolute inset-0" aria-hidden>
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
        <div className="login-gate-mist pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(126,184,255,0.14),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col justify-end gap-10 px-5 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-8 sm:pb-14 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16 lg:pb-16 lg:pt-16">
        <div className="login-gate-copy max-w-xl pb-2 lg:pb-8">
          <div className="flex items-center gap-3">
            <AnikuraMark size={44} className="ring-1 ring-white/15" />
            <p className="font-jp text-[0.72rem] tracking-[0.28em] text-sakura-soft/90">
              アニクラ
            </p>
          </div>
          <h1 className="mt-5 text-[clamp(2.6rem,7vw,4.4rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-snow">
            One more step
          </h1>
          <p className="mt-4 max-w-md text-[clamp(1rem,2.2vw,1.2rem)] font-medium leading-snug tracking-[-0.02em] text-snow/90">
            Link Discord and join the server to open the theater.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-cloud/90">
            This keeps Anikura for people who show up — not drive-by guests.
          </p>
        </div>

        <div className="login-gate-panel w-full max-w-md self-stretch lg:self-end lg:justify-self-end">
          <div className="rounded-[1.4rem] border border-white/[0.12] bg-black/55 p-5 shadow-[0_40px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-6">
            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-mute">
              Required
            </p>
            <h2 className="mt-1 text-[1.55rem] font-semibold tracking-[-0.04em] text-snow">
              Join Discord
            </h2>

            <ol className="mt-6 space-y-5">
              <li className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-sm font-medium text-snow">
                  1
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-snow">Link Discord</p>
                  <p className="mt-1 text-sm text-mute">
                    Connect the Discord account you use on the server.
                  </p>
                  {linked ? (
                    <p className="mt-3 text-sm text-emerald-300/90">
                      Discord linked.
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void linkDiscord()}
                      className="mt-3 rounded-full bg-[#5865F2] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#4752c4] disabled:opacity-60"
                    >
                      {busy === "link" ? "Opening Discord…" : "Link Discord"}
                    </button>
                  )}
                </div>
              </li>

              <li className="flex gap-4">
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
                    className="mt-3 inline-flex rounded-full border border-white/20 px-4 py-2.5 text-sm font-medium text-snow transition hover:border-white/35 hover:bg-white/[0.06]"
                  >
                    Open Discord invite
                  </a>
                </div>
              </li>

              <li className="flex gap-4">
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
                    className="mt-3 rounded-full bg-snow px-4 py-2.5 text-sm font-medium text-void transition hover:bg-white disabled:opacity-50"
                  >
                    {busy === "verify" ? "Checking…" : "I’ve joined — verify"}
                  </button>
                </div>
              </li>
            </ol>

            {error ? (
              <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <p className="mt-8 text-center text-xs text-mute">
              Wrong account?{" "}
              <Link href="/login" className="text-cloud hover:text-snow">
                Sign out from Account, then try again
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
