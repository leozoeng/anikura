"use client";

import { useEffect, useRef, useState } from "react";
import {
  LIST_STATUSES,
  labelForStatus,
  type AnimeListInput,
  type ListStatus,
} from "@/lib/anime-list";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isInMyList, toggleMyList } from "@/lib/mylist";

type Props = AnimeListInput & {
  className?: string;
  variant?: "icon" | "pill";
};

type EntryState = {
  status: ListStatus | null;
  isFavorite: boolean;
};

export function ListStatusButton({
  anime_id,
  slug,
  title,
  poster,
  className = "",
  variant = "icon",
}: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [entry, setEntry] = useState<EntryState>({
    status: null,
    isFavorite: false,
  });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setEntry({
        status: isInMyList(anime_id) ? "planned" : null,
        isFavorite: false,
      });
      const sync = () =>
        setEntry({
          status: isInMyList(anime_id) ? "planned" : null,
          isFavorite: false,
        });
      window.addEventListener("anikura:mylist", sync);
      return () => window.removeEventListener("anikura:mylist", sync);
    }

    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);
      if (!user) {
        setEntry({
          status: isInMyList(anime_id) ? "planned" : null,
          isFavorite: false,
        });
        return;
      }
      const { data } = await supabase
        .from("anime_list")
        .select("status, is_favorite")
        .eq("user_id", user.id)
        .eq("anime_id", anime_id)
        .maybeSingle();
      if (cancelled) return;
      setEntry({
        status: (data?.status as ListStatus) ?? null,
        isFavorite: Boolean(data?.is_favorite),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [anime_id]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function setStatus(status: ListStatus | null) {
    if (busy) return;
    setBusy(true);
    try {
      if (!userId || !isSupabaseConfigured()) {
        if (status) {
          if (!isInMyList(anime_id)) {
            toggleMyList({ id: anime_id, slug, title, poster });
          }
          setEntry({ status, isFavorite: false });
        } else {
          if (isInMyList(anime_id)) {
            toggleMyList({ id: anime_id, slug, title, poster });
          }
          setEntry({ status: null, isFavorite: false });
        }
        setOpen(false);
        return;
      }

      const supabase = createClient();
      if (!status) {
        await supabase
          .from("anime_list")
          .delete()
          .eq("user_id", userId)
          .eq("anime_id", anime_id);
        setEntry({ status: null, isFavorite: false });
      } else {
        const { data, error } = await supabase
          .from("anime_list")
          .upsert(
            {
              user_id: userId,
              anime_id,
              slug,
              title,
              poster,
              status,
              is_favorite: entry.isFavorite,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,anime_id" },
          )
          .select("status, is_favorite")
          .single();
        if (error) throw error;
        setEntry({
          status: data.status as ListStatus,
          isFavorite: Boolean(data.is_favorite),
        });
      }
      window.dispatchEvent(new CustomEvent("anikura:animelist"));
      setOpen(false);
    } catch {
      // keep prior state
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite() {
    if (!userId || !isSupabaseConfigured() || busy) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const nextFav = !entry.isFavorite;
      const status = entry.status ?? "planned";
      const { data, error } = await supabase
        .from("anime_list")
        .upsert(
          {
            user_id: userId,
            anime_id,
            slug,
            title,
            poster,
            status,
            is_favorite: nextFav,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,anime_id" },
        )
        .select("status, is_favorite")
        .single();
      if (error) throw error;
      setEntry({
        status: data.status as ListStatus,
        isFavorite: Boolean(data.is_favorite),
      });
      window.dispatchEvent(new CustomEvent("anikura:animelist"));
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  const active = Boolean(entry.status);
  const label = entry.status
    ? labelForStatus(entry.status)
    : "Add to list";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        disabled={busy}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={
          variant === "pill"
            ? `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tracking-[-0.01em] transition ${
                active
                  ? "bg-raised text-snow ring-1 ring-white/15 hover:bg-white/10"
                  : "bg-white text-black hover:bg-white/90"
              }`
            : `grid h-8 w-8 place-items-center rounded-full backdrop-blur-md transition ${
                active || entry.isFavorite
                  ? "bg-snow text-void"
                  : "bg-black/50 text-snow hover:bg-black/70"
              }`
        }
      >
        {variant === "pill" ? (
          <>
            <HeartIcon filled={entry.isFavorite || active} />
            <span>{label}</span>
          </>
        ) : (
          <HeartIcon filled={entry.isFavorite || active} />
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[12rem] overflow-hidden rounded-xl border border-white/[0.1] bg-[#0c0c0e] py-1 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {LIST_STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="menuitem"
              onClick={() => void setStatus(s.id)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-white/[0.06] ${
                entry.status === s.id ? "text-snow" : "text-cloud"
              }`}
            >
              <span>{s.label}</span>
              {entry.status === s.id ? <span aria-hidden>✓</span> : null}
            </button>
          ))}
          {userId ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => void toggleFavorite()}
              className="mt-1 flex w-full items-center justify-between border-t border-white/[0.06] px-3 py-2 text-left text-sm text-cloud transition hover:bg-white/[0.06] hover:text-snow"
            >
              <span>{entry.isFavorite ? "Unfavorite" : "Favorite"}</span>
              <span aria-hidden>{entry.isFavorite ? "★" : "☆"}</span>
            </button>
          ) : null}
          {entry.status ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => void setStatus(null)}
              className="flex w-full px-3 py-2 text-left text-sm text-mute transition hover:bg-white/[0.06] hover:text-snow"
            >
              Remove from list
            </button>
          ) : null}
          {!userId ? (
            <p className="border-t border-white/[0.06] px-3 py-2 text-[0.7rem] text-mute">
              Sign in to sync lists across devices.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M8 13.5 2.5 8.5c-1.5-1.5-1.5-4 0-5.5s4-1.5 5.5 0L8 4.5l1-1c1.5-1.5 4-1.5 5.5 0s1.5 4 0 5.5L8 13.5Z" />
    </svg>
  );
}
