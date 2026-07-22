"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BOARD_LIST_STATUSES,
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

const MENU_WIDTH = 192;

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
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setEntry({
        status: isInMyList(anime_id) ? "watching" : null,
        isFavorite: false,
      });
      const sync = () =>
        setEntry({
          status: isInMyList(anime_id) ? "watching" : null,
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
          status: isInMyList(anime_id) ? "watching" : null,
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

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }

    const place = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 280;
      let left = rect.right - MENU_WIDTH;
      left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const top =
        spaceBelow < menuHeight && rect.top > menuHeight + 8
          ? rect.top - menuHeight - 8
          : rect.bottom + 8;
      setMenuPos({ top, left });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, entry.isFavorite, entry.status, userId]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
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
    const prev = entry;
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
        setEntry({ status: null, isFavorite: false });
        const { error } = await supabase
          .from("anime_list")
          .delete()
          .eq("user_id", userId)
          .eq("anime_id", anime_id);
        if (error) throw error;
      } else {
        setEntry({ status, isFavorite: prev.isFavorite });
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
              is_favorite: prev.isFavorite,
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
      setEntry(prev);
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite() {
    if (!userId || !isSupabaseConfigured() || busy) return;
    setBusy(true);
    const prev = entry;
    const nextFav = !entry.isFavorite;
    const status = entry.status ?? "watching";
    setEntry({ status, isFavorite: nextFav });
    try {
      const supabase = createClient();
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
      setEntry(prev);
    } finally {
      setBusy(false);
    }
  }

  const active = Boolean(entry.status);
  const label = entry.status
    ? labelForStatus(entry.status)
    : "Add to list";

  const menu =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[200] min-w-[12rem] overflow-hidden rounded-xl border border-white/[0.1] bg-[#0c0c0e] py-1 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            style={{
              top: menuPos?.top ?? -9999,
              left: menuPos?.left ?? -9999,
              width: MENU_WIDTH,
              visibility: menuPos ? "visible" : "hidden",
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {userId ? (
              <button
                type="button"
                role="menuitem"
                aria-pressed={entry.isFavorite}
                onClick={() => void toggleFavorite()}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-white/[0.06] ${
                  entry.isFavorite ? "text-snow" : "text-cloud"
                }`}
              >
                <span>Favourites</span>
                <span aria-hidden>{entry.isFavorite ? "✓" : "☆"}</span>
              </button>
            ) : null}
            {BOARD_LIST_STATUSES.map((s) => (
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
            {entry.status ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => void setStatus(null)}
                className="mt-1 flex w-full border-t border-white/[0.06] px-3 py-2 text-left text-sm text-mute transition hover:bg-white/[0.06] hover:text-snow"
              >
                Remove from list
              </button>
            ) : null}
            {!userId ? (
              <p className="border-t border-white/[0.06] px-3 py-2 text-[0.7rem] text-mute">
                Sign in to sync lists across devices.
              </p>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
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
                active || entry.isFavorite
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
      {menu}
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
