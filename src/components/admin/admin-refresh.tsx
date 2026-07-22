"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

/** Soft refresh while the admin tab is visible — skips hidden tabs to avoid jank. */
export function AdminRefresh({ intervalMs = 45_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
    };
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, router]);

  return null;
}

/** Manual refresh with busy state for the command strip. */
export function useAdminManualRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lastAt, setLastAt] = useState<number | null>(null);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
      setLastAt(Date.now());
    });
  }, [router]);

  return { refresh, refreshing: pending, lastAt };
}
