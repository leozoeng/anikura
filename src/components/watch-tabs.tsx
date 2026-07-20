"use client";

import { useState, type ReactNode } from "react";

type Tab = {
  id: string;
  label: string;
  content: ReactNode;
};

type Props = {
  tabs: Tab[];
  defaultTab?: string;
};

export function WatchTabs({ tabs, defaultTab }: Props) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  const current = tabs.find((t) => t.id === active) || tabs[0];

  return (
    <div>
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium tracking-[-0.01em] transition ${
                isActive
                  ? "bg-snow text-void"
                  : "bg-raised text-cloud hover:bg-white/10 hover:text-snow"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="pt-6">{current?.content}</div>
    </div>
  );
}
