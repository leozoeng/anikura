"use client";

import { SafeImage } from "@/components/safe-image";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AnimeListEntry, ListStatus } from "@/lib/anime-list";
import { preferHighResPoster } from "@/lib/cover-image";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SearchHit } from "@/lib/search";

export type BoardShelfId = "favorites" | "watching" | "completed" | "on_hold";

type Props = {
  shelf: BoardShelfId;
  title: string;
  accent: string;
  existingIds: Set<number>;
  onClose: () => void;
  onAdded: (entry: AnimeListEntry) => void;
};

const SHELF_STATUS: Record<
  Exclude<BoardShelfId, "favorites">,
  ListStatus
> = {
  watching: "watching",
  completed: "completed",
  on_hold: "on_hold",
};

export function BoardShelfPicker({
  shelf,
  title,
  accent,
  existingIds,
  onClose,
  onAdded,
}: Props) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(q)}&scope=local`,
            { signal: ctrl.signal },
          );
          const json = (await res.json()) as { results?: SearchHit[] };
          setHits(json.results ?? []);
        } catch (err) {
          if ((err as Error).name !== "AbortError") setHits([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 200);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  async function addHit(hit: SearchHit) {
    if (!hit.href.startsWith("/anime/")) return;
    const animeId = Number(hit.href.split("/")[2]);
    if (!Number.isFinite(animeId) || animeId <= 0) return;
    if (existingIds.has(animeId) || busyId != null) return;
    if (!isSupabaseConfigured()) {
      setError("Sign in to save shelves.");
      return;
    }

    setBusyId(animeId);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sign in to save shelves.");
        return;
      }

      const { data: prev } = await supabase
        .from("anime_list")
        .select("status, is_favorite")
        .eq("user_id", user.id)
        .eq("anime_id", animeId)
        .maybeSingle();

      const nextStatus: ListStatus =
        shelf === "favorites"
          ? ((prev?.status as ListStatus | undefined) ?? "watching")
          : SHELF_STATUS[shelf];
      const nextFavorite =
        shelf === "favorites" ? true : Boolean(prev?.is_favorite);

      const poster = preferHighResPoster(hit.poster) || hit.poster;
      const { data, error: upsertError } = await supabase
        .from("anime_list")
        .upsert(
          {
            user_id: user.id,
            anime_id: animeId,
            slug: hit.href.split("/")[3] || String(animeId),
            title: hit.title,
            poster,
            status: nextStatus,
            is_favorite: nextFavorite,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,anime_id" },
        )
        .select("*")
        .single();
      if (upsertError) throw upsertError;

      onAdded(data as AnimeListEntry);
      window.dispatchEvent(new CustomEvent("anikura:animelist"));
      onClose();
    } catch {
      setError("Couldn’t add that title. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex max-h-[min(32rem,78vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#111214]/88 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-mute">
              Add to shelf
            </p>
            <h2
              id={titleId}
              className="mt-0.5 text-base font-semibold tracking-[-0.02em] text-snow"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-full text-mute transition hover:bg-white/[0.08] hover:text-snow"
            aria-label="Close picker"
          >
            ✕
          </button>
        </div>

        <div className="px-4 pt-3">
          <label className="block">
            <span className="sr-only">Search series</span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search series…"
              className="w-full rounded-xl border border-white/10 bg-black/35 px-3.5 py-2.5 text-sm text-snow outline-none transition placeholder:text-mute focus:border-white/25"
              style={{ caretColor: accent }}
            />
          </label>
          {error ? (
            <p className="mt-2 text-xs text-[#ff8a8a]" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
          {query.trim().length < 2 ? (
            <p className="px-2 py-6 text-center text-sm text-mute">
              Type at least 2 characters.
            </p>
          ) : searching && hits.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-mute">Searching…</p>
          ) : hits.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-mute">
              No titles matched.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {hits.map((hit) => {
                const animeId = Number(hit.href.split("/")[2]);
                const already =
                  Number.isFinite(animeId) && existingIds.has(animeId);
                const busy = busyId === animeId;
                return (
                  <li key={hit.key}>
                    <button
                      type="button"
                      disabled={already || busy || !hit.href.startsWith("/anime/")}
                      onClick={() => void addHit(hit)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-raised ring-1 ring-white/10">
                        {hit.poster ? (
                          <SafeImage
                            src={preferHighResPoster(hit.poster) || hit.poster}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-medium text-snow">
                          {hit.title}
                        </span>
                        <span className="mt-0.5 block text-[0.7rem] text-mute">
                          {already
                            ? "Already on this shelf"
                            : [hit.type, hit.year].filter(Boolean).join(" · ") ||
                              "Add"}
                        </span>
                      </span>
                      {!already ? (
                        <span
                          className="shrink-0 text-lg font-light"
                          style={{ color: accent }}
                          aria-hidden
                        >
                          {busy ? "…" : "+"}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
