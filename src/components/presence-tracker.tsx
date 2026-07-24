"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getOrCreateSessionId } from "@/lib/session-id";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Keep admin “live” window in sync (see admin page p_live_seconds). */
const HEARTBEAT_MS = 240_000;

export function PresenceTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (pathname?.startsWith("/admin")) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function beat(trackPageView: boolean) {
      if (cancelled) return;
      try {
        const sessionId = getOrCreateSessionId();
        await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            path: pathname ?? "/",
            trackPageView,
          }),
          keepalive: true,
        });
      } catch {
        // Presence is best-effort.
      }
    }

    const isNewPath = lastPath.current !== pathname;
    lastPath.current = pathname ?? "/";
    void beat(isNewPath);

    timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void beat(false);
    }, HEARTBEAT_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void beat(false);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname]);

  return null;
}
