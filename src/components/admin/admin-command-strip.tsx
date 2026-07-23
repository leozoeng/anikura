"use client";

import { useCallback, useEffect } from "react";

export type AdminNavItem = {
  id: string;
  label: string;
  shortcut: string;
};

type AdminCommandStripProps = {
  items: AdminNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
};

export function AdminCommandStrip({
  items,
  activeId,
  onChange,
  onRefresh,
  refreshing,
}: AdminCommandStripProps) {
  const select = useCallback(
    (id: string) => {
      onChange(id);
    },
    [onChange],
  );

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
      select(items[idx - 1]!.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, onRefresh, select]);

  return (
    <div className="sticky top-16 z-40 -mx-5 mb-2.5 border-y border-white/[0.06] bg-black/75 px-5 backdrop-blur-xl sm:-mx-8 sm:mb-3 sm:px-8">
      <div className="flex items-center gap-2 py-1.5">
        <nav
          className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto scrollbar-none sm:gap-1"
          aria-label="Admin tabs"
          role="tablist"
        >
          {items.map((item, i) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                id={`admin-tab-${item.id}`}
                onClick={() => select(item.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition duration-200 ease-[var(--ease-out-soft)] ${
                  isActive
                    ? "bg-snow text-void shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
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
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-cloud transition duration-200 ease-[var(--ease-out-soft)] hover:border-white/20 hover:text-snow disabled:opacity-60"
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
