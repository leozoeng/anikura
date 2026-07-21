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
import type { SearchHit } from "@/lib/search";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DEBOUNCE_MS = 140;
const LOADING_DELAY_MS = 120;
const CLIENT_CACHE_MAX = 32;

const clientCache = new Map<string, SearchHit[]>();

function cacheGet(query: string): SearchHit[] | undefined {
  const key = query.toLowerCase();
  const hit = clientCache.get(key);
  if (!hit) return undefined;
  clientCache.delete(key);
  clientCache.set(key, hit);
  return hit;
}

function cacheSet(query: string, results: SearchHit[]) {
  const key = query.toLowerCase();
  if (clientCache.has(key)) clientCache.delete(key);
  clientCache.set(key, results);
  while (clientCache.size > CLIENT_CACHE_MAX) {
    const oldest = clientCache.keys().next().value;
    if (oldest === undefined) break;
    clientCache.delete(oldest);
  }
}

export function SearchCommand({ open, onOpenChange }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    setQ("");
    setResults([]);
    setActive(0);
    setLoading(false);
    setShowLoading(false);
    abortRef.current?.abort();
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const prev = document.body.style.overflow;
    if (mobile) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (loading) {
      loadingDelayRef.current = setTimeout(() => setShowLoading(true), LOADING_DELAY_MS);
      return () => {
        if (loadingDelayRef.current) clearTimeout(loadingDelayRef.current);
      };
    }
    setShowLoading(false);
    if (loadingDelayRef.current) clearTimeout(loadingDelayRef.current);
  }, [loading]);

  const applyResults = useCallback((hits: SearchHit[]) => {
    setResults(hits);
    setActive(0);
  }, []);

  const runSearch = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        abortRef.current?.abort();
        setResults([]);
        setLoading(false);
        return;
      }

      const cached = cacheGet(trimmed);
      if (cached) {
        applyResults(cached);
        setLoading(false);
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;

      if (!cached) setLoading(true);

      try {
        // Paint local catalog hits first, then enrich with AniList if needed.
        const localRes = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&scope=local`,
          { signal: controller.signal },
        );
        if (requestId !== requestIdRef.current) return;
        const localData = (await localRes.json()) as { results: SearchHit[] };
        const localHits = localData.results || [];
        if (!cached || localHits.length) {
          applyResults(localHits);
          if (localHits.length) cacheSet(trimmed, localHits);
        }

        // Enough catalog hits — skip AniList round-trip.
        if (localHits.length >= 5) {
          cacheSet(trimmed, localHits);
          return;
        }

        const fullRes = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (requestId !== requestIdRef.current) return;
        const fullData = (await fullRes.json()) as { results: SearchHit[] };
        const fullHits = fullData.results || [];
        applyResults(fullHits);
        cacheSet(trimmed, fullHits);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (requestId !== requestIdRef.current) return;
        if (!cached) setResults([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [applyResults],
  );

  function onChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      return;
    }

    const cached = cacheGet(trimmed);
    if (cached) {
      applyResults(cached);
      setLoading(false);
    }

    debounceRef.current = setTimeout(() => {
      void runSearch(value);
    }, cached ? 80 : DEBOUNCE_MS);
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
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active].href);
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
        className="hidden h-9 w-9 items-center justify-center rounded-full border border-transparent text-cloud transition hover:border-white/10 hover:bg-white/[0.06] hover:text-snow active:scale-[0.97] md:inline-flex sm:w-auto sm:gap-2 sm:px-3"
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

  const showPanel = results.length > 0 || (showLoading && q.trim().length >= 2);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[60] flex flex-col bg-void/98 pt-[env(safe-area-inset-top)] animate-rise md:relative md:inset-auto md:z-auto md:block md:bg-transparent md:pt-0"
    >
      <div className="flex items-center gap-2 border-b border-white/[0.08] px-3 py-3 md:border-0 md:p-0">
        <form onSubmit={onSubmit} className="min-w-0 flex-1 md:flex-none">
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
              aria-activedescendant={
                results[active] ? `${listId}-${active}` : undefined
              }
              aria-autocomplete="list"
              placeholder="Search anime"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-full border border-white/15 bg-white/8 py-2.5 pl-4 pr-12 text-sm text-snow outline-none placeholder:text-mute focus:border-white/35 focus:bg-white/10 md:w-[min(78vw,320px)] md:py-2"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-mute">
              {showLoading ? (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border border-mute/40 border-t-snow/80" />
              ) : (
                <span className="hidden md:inline">⌘K</span>
              )}
            </span>
          </label>
        </form>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="shrink-0 rounded-full px-3 py-2 text-sm text-cloud transition hover:bg-white/10 hover:text-snow md:hidden"
        >
          Cancel
        </button>
      </div>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="min-h-0 flex-1 overflow-y-auto px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:absolute md:right-0 md:z-50 md:mt-2 md:w-[min(92vw,380px)] md:flex-none md:overflow-hidden md:rounded-2xl md:border md:border-white/10 md:bg-black/90 md:p-0 md:pb-0 md:shadow-[0_30px_80px_rgba(0,0,0,0.65)] md:backdrop-blur-2xl"
        >
          {showLoading && results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-mute">Searching…</p>
          ) : (
            <ul className="md:max-h-[70vh] md:overflow-y-auto md:py-2">
              {results.map((hit, index) => (
                <li key={hit.key}>
                  <Link
                    id={`${listId}-${index}`}
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
                          priority={index < 4}
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
