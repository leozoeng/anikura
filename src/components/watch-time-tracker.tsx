"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getOrCreateSessionId } from "@/lib/session-id";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Wall-clock seconds on /watch while the tab is visible (embed proxy). */
const TICK_MS = 30_000;

export function WatchTimeTracker() {
  const pathname = usePathname();
  const lastFlush = useRef(Date.now());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (!pathname?.startsWith("/watch")) return;

    let cancelled = false;

    async function flush(seconds: number) {
      if (cancelled || seconds < 1) return;
      try {
        const sessionId = getOrCreateSessionId();
        await fetch("/api/watch-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            seconds: Math.min(180, Math.round(seconds)),
            path: pathname,
          }),
          keepalive: true,
        });
      } catch {
        // Best-effort analytics.
      }
    }

    lastFlush.current = Date.now();

    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") {
        lastFlush.current = Date.now();
        return;
      }
      const elapsed = (Date.now() - lastFlush.current) / 1000;
      lastFlush.current = Date.now();
      void flush(elapsed);
    }, TICK_MS);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        const elapsed = (Date.now() - lastFlush.current) / 1000;
        lastFlush.current = Date.now();
        void flush(elapsed);
      } else {
        lastFlush.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      const elapsed = (Date.now() - lastFlush.current) / 1000;
      if (elapsed >= 5) void flush(elapsed);
    };
  }, [pathname]);

  return null;
}
