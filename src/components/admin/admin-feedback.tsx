"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "ok" | "err" | "info";

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type FeedbackApi = {
  toast: (message: string, tone?: ToastTone) => void;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useAdminFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    return {
      toast: () => {
        /* no-op outside provider */
      },
    };
  }
  return ctx;
}

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    const t = window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== latest.id));
    }, 3200);
    return () => window.clearTimeout(t);
  }, [toasts]);

  return (
    <FeedbackContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 right-4 z-[80] flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`admin-toast pointer-events-auto rounded-xl border px-3.5 py-2.5 text-sm shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md ${
              t.tone === "err"
                ? "border-red-400/25 bg-black/80 text-red-200"
                : t.tone === "info"
                  ? "border-white/12 bg-black/80 text-cloud"
                  : "border-white/14 bg-black/80 text-snow"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}
