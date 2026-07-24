"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/site-url";

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

      // Refresh JWT so app_metadata.discord_verified is on the cookie.
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
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-6 text-sm text-amber-100">
        Discord gate is not configured yet. Add{" "}
        <code className="text-snow">DISCORD_GUILD_ID</code> and{" "}
        <code className="text-snow">DISCORD_BOT_TOKEN</code> on the host, enable
        Discord as an Auth provider in Supabase, and invite the bot to your
        server.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.1] bg-[#0a0a0c] p-6 sm:p-8">
      <p className="text-[0.7rem] uppercase tracking-[0.18em] text-mute">
        Required
      </p>
      <h1 className="mt-1 text-3xl tracking-[-0.03em] text-snow">
        Join Discord to continue
      </h1>
      <p className="mt-2 text-sm text-cloud">
        Anikura is members-only. Link Discord, join the server, then verify —
        that unlocks watching and the rest of the site.
      </p>

      <ol className="mt-8 space-y-5">
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
              <p className="mt-3 text-sm text-emerald-300/90">Discord linked.</p>
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
            <p className="text-sm font-medium text-snow">Verify membership</p>
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
  );
}
