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
/** Only treat "complete" as real once we've seen substantial playback. */
const ARM_PROGRESS = 0.85;

const EMBED_ORIGINS = new Set([
  "https://megaplay.buzz",
  "https://www.megaplay.buzz",
  "https://supaplay.fun",
  "https://www.supaplay.fun",
]);

type PlayerPayload = {
  event?: unknown;
  type?: unknown;
  time?: unknown;
  duration?: unknown;
  percent?: unknown;
  currentTime?: unknown;
};

function parsePayload(data: unknown): PlayerPayload | null {
  if (data == null) return null;
  if (typeof data === "object") return data as PlayerPayload;
  if (typeof data !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(data);
    if (parsed && typeof parsed === "object") return parsed as PlayerPayload;
  } catch {
    /* ignore non-JSON strings */
  }
  return null;
}

function progressFrom(payload: PlayerPayload): number | null {
  if (typeof payload.percent === "number" && Number.isFinite(payload.percent)) {
    // MegaPlay sends 0–100 in some builds and 0–1 in others.
    return payload.percent > 1 ? payload.percent / 100 : payload.percent;
  }

  const time =
    typeof payload.time === "number"
      ? payload.time
      : typeof payload.currentTime === "number"
        ? payload.currentTime
        : null;
  const duration =
    typeof payload.duration === "number" ? payload.duration : null;

  if (time != null && duration != null && duration > 30 && time >= 0) {
    return Math.min(1, time / duration);
  }

  return null;
}

function isTrustedOrigin(origin: string) {
  if (EMBED_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return (
      host === "megaplay.buzz" ||
      host.endsWith(".megaplay.buzz") ||
      host === "supaplay.fun" ||
      host.endsWith(".supaplay.fun")
    );
  } catch {
    return false;
  }
}

export function AutoplayNext({
  nextHref,
  nextLabel,
  enabled,
  armed: _armed,
  onArm,
}: Props) {
  const router = useRouter();
  const [seconds, setSeconds] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);
  const maxProgressRef = useRef(0);
  const onArmRef = useRef(onArm);
  onArmRef.current = onArm;

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
    maxProgressRef.current = 0;
  }, [nextHref, cancel]);

  useEffect(() => {
    if (!enabled || !nextHref) return;

    function onMessage(e: MessageEvent) {
      if (!isTrustedOrigin(e.origin)) return;

      const payload = parsePayload(e.data);
      if (!payload) return;

      const progress = progressFrom(payload);
      if (progress != null && progress > maxProgressRef.current) {
        maxProgressRef.current = progress;
        if (progress >= ARM_PROGRESS) onArmRef.current();
      }

      // MegaPlay / SupaPlay: only `event: "complete"` means the episode ended.
      // Never substring-match free-form postMessage traffic.
      if (payload.event !== "complete") return;
      if (maxProgressRef.current < ARM_PROGRESS) return;
      onArmRef.current();
      start();
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [enabled, nextHref, start]);

  useEffect(() => () => cancel(), [cancel]);

  return (
    <>
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
              <Link
                href={nextHref || "#"}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black"
                onClick={cancel}
              >
                Play now
              </Link>
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
