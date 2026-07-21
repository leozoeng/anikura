"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SearchPageForm({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = q.trim();
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <form onSubmit={onSubmit} className="mt-5">
      <label className="relative block">
        <span className="sr-only">Search anime</span>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M11.2 11.2 14 14"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles…"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          autoFocus={!initialQuery}
          className="w-full rounded-[16px] border border-white/[0.12] bg-white/[0.05] py-3.5 pl-11 pr-4 text-[1rem] text-snow outline-none transition placeholder:text-mute focus:border-white/28 focus:bg-white/[0.08]"
        />
      </label>
    </form>
  );
}
