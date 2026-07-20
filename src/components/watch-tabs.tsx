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
      <div className="flex gap-1 border-b border-white/8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`relative px-4 py-3 text-sm font-medium tracking-[-0.01em] transition ${
              active === tab.id
                ? "text-snow"
                : "text-mute hover:text-cloud"
            }`}
          >
            {tab.label}
            {active === tab.id && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-snow" />
            )}
          </button>
        ))}
      </div>
      <div className="pt-8">{current?.content}</div>
    </div>
  );
}
