"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const SKIP_PREFIXES = [
  "/login",
  "/join-discord",
  "/auth/",
  "/api/",
  "/admin",
];

const OK_KEY = "anikura_discord_gate_ok";

function shouldSkip(pathname: string) {
  return SKIP_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p),
  );
}

/**
 * On refresh / navigation: if the Discord gate is on and this account is not
 * verified, send them to /join-discord. Already-verified members are healed
 * via /api/discord/status and never prompted again this session.
 */
export function DiscordGateGuard() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const inFlight = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (shouldSkip(pathname)) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(OK_KEY) === "1") return;
    if (inFlight.current) return;

    let cancelled = false;
    inFlight.current = true;

    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;
        if (cancelled) return;

        const res = await fetch("/api/discord/status", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) return;

        const data = (await res.json()) as {
          gateRequired?: boolean;
          verified?: boolean;
          linked?: boolean;
          healed?: boolean;
        };

        if (!data.gateRequired) {
          sessionStorage.setItem(OK_KEY, "1");
          return;
        }

        if (data.verified) {
          if (data.healed) {
            await supabase.auth.refreshSession();
          }
          sessionStorage.setItem(OK_KEY, "1");
          return;
        }

        // Not verified — force Discord onboarding on this refresh.
        const next =
          pathname.startsWith("/") && !pathname.startsWith("//")
            ? `${pathname}${window.location.search}`
            : "/";
        router.replace(
          `/join-discord?next=${encodeURIComponent(next === "/join-discord" ? "/" : next)}`,
        );
      } catch {
        // Best-effort; proxy still enforces when configured.
      } finally {
        inFlight.current = false;
      }
    })();

    return () => {
      cancelled = true;
      inFlight.current = false;
    };
  }, [pathname, router]);

  return null;
}
