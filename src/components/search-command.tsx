"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { SearchHit } from "@/app/api/search/route";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SearchCommand({ open, onOpenChange }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
    setQ("");
    setResults([]);
    setActive(0);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        if (!q) onOpenChange(false);
      }
    }
    if (!open) return;
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, q, onOpenChange]);

  const runSearch = useCallback(async (value: string) => {
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);
      const data = (await res.json()) as { results: SearchHit[] };
      setResults(data.results || []);
      setActive(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function onChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(value);
    }, 220);
  }

  function go(href: string) {
    onOpenChange(false);
    startTransition(() => router.push(href));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (results[active]) {
      go(results[active].href);
      return;
    }
    const query = q.trim();
    if (!query) return;
    go(`/search?q=${encodeURIComponent(query)}`);
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Open search"
        onClick={() => onOpenChange(true)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-transparent px-2.5 text-cloud transition hover:border-white/10 hover:bg-white/[0.06] hover:text-snow sm:px-3"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M11.2 11.2 14 14"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <span className="hidden text-[0.8125rem] tracking-[-0.01em] sm:inline">
          Search
        </span>
        <kbd className="hidden rounded-md border border-white/12 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-mute lg:inline">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div ref={rootRef} className="relative animate-rise">
      <form onSubmit={onSubmit}>
        <label className="relative block">
          <span className="sr-only">Search anime</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            placeholder="Search anime"
            className="w-[min(78vw,320px)] rounded-full border border-white/15 bg-white/8 py-2 pl-4 pr-12 text-sm text-snow outline-none placeholder:text-mute focus:border-white/35 focus:bg-white/10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-mute">
            {loading ? "…" : "⌘K"}
          </span>
        </label>
      </form>

      {(results.length > 0 || (loading && q.length >= 2)) && (
        <div
          id={listId}
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-[0_30px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
        >
          {loading && results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-mute">Searching…</p>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto py-2">
              {results.map((hit, index) => (
                <li key={hit.key}>
                  <Link
                    href={hit.href}
                    role="option"
                    aria-selected={index === active}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => onOpenChange(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 transition ${
                      index === active ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-raised">
                      {hit.poster ? (
                        <Image
                          src={hit.poster}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium tracking-[-0.02em] text-snow">
                        {hit.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-mute">
                        {[hit.year, hit.score ? `${hit.score}` : null]
                          .filter(Boolean)
                          .join(" · ") ||
                          (hit.source === "anilist" ? "AniList" : "Catalog")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {q.trim().length >= 2 && (
            <button
              type="button"
              onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)}
              className="flex w-full items-center justify-between border-t border-white/8 px-4 py-3 text-left text-xs text-mute hover:bg-white/5 hover:text-snow"
            >
              <span>View all results for “{q.trim()}”</span>
              <span>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
