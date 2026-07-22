"use client";

import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SearchHit } from "@/lib/search";
import { formatPosterMeta } from "@/lib/poster-meta";

const DEBOUNCE_MS = 160;
const LOADING_DELAY_MS = 120;

type Props = {
  initialQuery?: string;
  /** Server-rendered poster grid for submitted `?q=` searches. */
  children?: ReactNode;
  /** Result count from the server when `initialQuery` is set. */
  serverResultCount?: number;
};

export function SearchPageForm({
  initialQuery = "",
  children,
  serverResultCount = 0,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  /** True once the user edits the field (live preview mode). */
  const [live, setLive] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setQ(initialQuery);
    setLive(false);
    setHits([]);
    setLoading(false);
  }, [initialQuery]);

  useEffect(() => {
    if (loading) {
      loadingDelayRef.current = setTimeout(
        () => setShowLoading(true),
        LOADING_DELAY_MS,
      );
      return () => {
        if (loadingDelayRef.current) clearTimeout(loadingDelayRef.current);
      };
    }
    setShowLoading(false);
    if (loadingDelayRef.current) clearTimeout(loadingDelayRef.current);
  }, [loading]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      abortRef.current?.abort();
      setHits([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const localRes = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}&scope=local`,
        { signal: controller.signal },
      );
      if (requestId !== requestIdRef.current) return;
      const localData = (await localRes.json()) as { results: SearchHit[] };
      const localHits = localData.results || [];
      setHits(localHits);

      if (localHits.length >= 5) return;

      const fullRes = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal },
      );
      if (requestId !== requestIdRef.current) return;
      const fullData = (await fullRes.json()) as { results: SearchHit[] };
      setHits(fullData.results || []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (requestId !== requestIdRef.current) return;
      setHits([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  function onChange(value: string) {
    setQ(value);
    setLive(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      abortRef.current?.abort();
      setHits([]);
      setLoading(false);
      return;
    }

    // Avoid a "no matches" flash while the debounce waits.
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void runSearch(value);
    }, DEBOUNCE_MS);
  }

  function clearQuery() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setQ("");
    setHits([]);
    setLoading(false);
    setLive(true);
    if (initialQuery) router.push("/search");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = q.trim();
    setLive(false);
    setHits([]);
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  const trimmed = q.trim();
  const showLivePreview = live && trimmed.length >= 2;
  const showServerResults = Boolean(initialQuery) && !live;
  const showHelper = !trimmed;

  let status: string;
  if (showHelper) {
    status = "Type a title, studio, or vibe.";
  } else if (showLivePreview) {
    if (showLoading && hits.length === 0) status = "Searching…";
    else if (!loading && hits.length === 0 && trimmed.length >= 2) {
      status = "No matches yet — try another title.";
    } else {
      status = `${hits.length} match${hits.length === 1 ? "" : "es"}`;
    }
  } else if (showServerResults) {
    status = `${serverResultCount} result${serverResultCount === 1 ? "" : "s"}`;
  } else if (trimmed.length === 1) {
    status = "Keep typing…";
  } else {
    status = "Type a title, studio, or vibe.";
  }

  return (
    <>
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
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search titles…"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            autoFocus={!initialQuery}
            className="w-full rounded-[16px] border border-white/[0.12] bg-white/[0.05] py-3.5 pl-11 pr-11 text-[1rem] text-snow outline-none transition placeholder:text-mute focus:border-white/28 focus:bg-white/[0.08] [&::-webkit-search-cancel-button]:hidden"
          />
          {trimmed ? (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-mute transition hover:bg-white/10 hover:text-snow"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M3.5 3.5 10.5 10.5M10.5 3.5 3.5 10.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </label>
      </form>

      <p className="mt-3 text-sm text-cloud sm:text-base">{status}</p>

      {showLivePreview ? (
        <div className="mt-6">
          {showLoading && hits.length === 0 ? (
            <p className="py-8 text-sm text-mute">Searching…</p>
          ) : (
            <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              {hits.map((hit) => (
                <li key={hit.key}>
                  <Link
                    href={hit.href}
                    className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-white/[0.06] active:bg-white/[0.08]"
                  >
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-raised">
                      {hit.poster ? (
                        <SafeImage
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
                        {formatPosterMeta({
                          type: hit.type,
                          year: hit.year,
                          score: hit.score,
                        }) ||
                          (hit.source === "anilist" ? "AniList" : "Catalog")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {hits.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setLive(false);
                setHits([]);
                router.push(`/search?q=${encodeURIComponent(trimmed)}`);
              }}
              className="mt-3 flex w-full items-center justify-between rounded-xl px-1 py-2 text-left text-xs text-mute transition hover:text-snow"
            >
              <span>View all results for “{trimmed}”</span>
              <span>→</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {showServerResults ? children : null}
    </>
  );
}
