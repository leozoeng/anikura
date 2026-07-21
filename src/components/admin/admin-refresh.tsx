"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
