"use client";

import { useCallback, useEffect, useState } from "react";

export type AdminNavItem = {
  id: string;
  label: string;
  shortcut: string;
};

type AdminCommandStripProps = {
  items: AdminNavItem[];
  onRefresh: () => void;
  refreshing: boolean;
};

export function AdminCommandStrip({
  items,
  onRefresh,
  refreshing,
}: AdminCommandStripProps) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  const jump = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        onRefresh();
        return;
      }

      const idx = Number(e.key);
      if (!Number.isFinite(idx) || idx < 1 || idx > items.length) return;
      e.preventDefault();
      jump(items[idx - 1]!.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, jump, onRefresh]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (!el) continue;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) setActive(item.id);
        },
        { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [items]);

  return (
    <div className="sticky top-16 z-40 -mx-5 mb-3 border-y border-white/[0.06] bg-black/70 px-5 backdrop-blur-xl sm:-mx-8 sm:px-8">
      <div className="flex items-center gap-2 py-1.5">
        <nav
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto scrollbar-none"
          aria-label="Admin sections"
        >
          {items.map((item, i) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => jump(item.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
                  isActive
                    ? "bg-snow text-void"
                    : "text-mute hover:bg-white/[0.05] hover:text-snow"
                }`}
                title={`${item.label} (${item.shortcut})`}
              >
                <span className="mr-1.5 hidden tabular-nums text-[0.65rem] opacity-50 sm:inline">
                  {i + 1}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-cloud transition hover:border-white/20 hover:text-snow disabled:opacity-60"
          title="Refresh (R)"
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full bg-snow ${
              refreshing ? "animate-pulse" : "opacity-50"
            }`}
          />
          {refreshing ? "Syncing" : "Refresh"}
        </button>
      </div>
    </div>
  );
}
