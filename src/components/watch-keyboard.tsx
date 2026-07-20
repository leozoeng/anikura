"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  prevHref?: string;
  nextHref?: string;
  enabled?: boolean;
};

export function WatchKeyboard({ prevHref, nextHref, enabled = true }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J") {
        if (prevHref) {
          e.preventDefault();
          router.push(prevHref);
        }
      }
      if (e.key === "ArrowRight" || e.key === "k" || e.key === "K") {
        if (nextHref) {
          e.preventDefault();
          router.push(nextHref);
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevHref, nextHref, enabled, router]);

  return null;
}
