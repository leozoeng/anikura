"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  nextHref?: string;
  nextLabel?: string;
  enabled: boolean;
  armed: boolean;
  onArm: () => void;
};

const COUNTDOWN_SEC = 8;

export function AutoplayNext({
  nextHref,
  nextLabel,
  enabled,
  armed,
  onArm,
}: Props) {
  const router = useRouter();
  const [seconds, setSeconds] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);

  const cancel = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setSeconds(null);
    firedRef.current = false;
  }, []);

  const start = useCallback(() => {
    if (!nextHref || !enabled || firedRef.current) return;
    firedRef.current = true;
    setSeconds(COUNTDOWN_SEC);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s == null) return null;
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          router.push(nextHref);
          return null;
        }
        return s - 1;
      });
    }, 1000);
  }, [nextHref, enabled, router]);

  useEffect(() => {
    cancel();
  }, [nextHref, cancel]);

  useEffect(() => {
    if (!enabled || !nextHref || !armed) return;

    function onMessage(e: MessageEvent) {
      try {
        const raw =
          typeof e.data === "string"
            ? e.data
            : typeof e.data === "object"
              ? JSON.stringify(e.data)
              : "";
        if (/ended|complete|finish|next.?ep|video.?end/i.test(raw)) {
          start();
        }
      } catch {
        /* ignore */
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [enabled, nextHref, armed, start]);

  useEffect(() => () => cancel(), [cancel]);

  return (
    <>
      {nextHref && enabled && !armed && (
        <button
          type="button"
          onClick={onArm}
          className="mt-2 text-xs text-apple-blue hover:underline"
        >
          Autoplay next episode
        </button>
      )}
      {armed && seconds == null && (
        <p className="mt-2 text-xs text-mute">
          Autoplay armed — countdown starts when the player signals end
        </p>
      )}

      {seconds != null && (
        <div className="fixed inset-x-0 bottom-6 z-[120] flex justify-center px-4 animate-rise">
          <div className="flex w-full max-w-lg items-center gap-4 rounded-2xl border border-white/12 bg-black/90 p-4 shadow-2xl backdrop-blur-xl">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-lg font-semibold">
              {seconds}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.12em] text-mute">
                Up next
              </p>
              <p className="truncate text-sm font-medium">{nextLabel}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={cancel}
                className="rounded-full border border-white/12 px-3 py-1.5 text-xs text-cloud hover:text-snow"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={start}
                className="rounded-full bg-snow px-3 py-1.5 text-xs font-medium text-void"
              >
                Play now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Manual countdown starter for Up next card click-hold alternative */
export function useAutoplayCountdown(nextHref?: string, enabled = true) {
  const router = useRouter();
  const [seconds, setSeconds] = useState<number | null>(null);

  const startNow = useCallback(() => {
    if (!nextHref || !enabled) return;
    let s = COUNTDOWN_SEC;
    setSeconds(s);
    const t = setInterval(() => {
      s -= 1;
      if (s <= 0) {
        clearInterval(t);
        router.push(nextHref);
        setSeconds(null);
      } else {
        setSeconds(s);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [nextHref, enabled, router]);

  return { seconds, startNow, cancel: () => setSeconds(null) };
}
