"use client";

import { mangaHref, mangaReadHref } from "@/lib/atsu";
import type { MangaChapter, MangaPageImage } from "@/lib/manga-types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";

type Props = {
  mangaId: string;
  mangaTitle: string;
  chapter: MangaChapter;
  pages: MangaPageImage[];
  prevChapter: MangaChapter | null;
  nextChapter: MangaChapter | null;
};

const PROGRESS_KEY = "anikura:manga-progress";

function saveProgress(mangaId: string, chapterId: string, number: number) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    map[mangaId] = {
      chapterId,
      number,
      at: Date.now(),
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

export function MangaReader({
  mangaId,
  mangaTitle,
  chapter,
  pages,
  prevChapter,
  nextChapter,
}: Props) {
  const router = useRouter();
  const [chromeVisible, setChromeVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrolling = useRef(false);
  const scrollHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chapterLabel = chapter.title || `Chapter ${chapter.number}`;

  const preloadNext = useMemo(
    () => (nextChapter ? mangaReadHref(mangaId, nextChapter.id) : null),
    [mangaId, nextChapter],
  );

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const showChromeBriefly = useCallback(() => {
    setChromeVisible(true);
    clearHideTimer();
    hideTimer.current = setTimeout(() => setChromeVisible(false), 2600);
  }, [clearHideTimer]);

  useEffect(() => {
    saveProgress(mangaId, chapter.id, chapter.number);
    setChromeVisible(false);
    clearHideTimer();
    window.scrollTo({ top: 0 });
    return () => {
      clearHideTimer();
      if (scrollHideTimer.current) clearTimeout(scrollHideTimer.current);
    };
  }, [mangaId, chapter.id, chapter.number, clearHideTimer]);

  useEffect(() => {
    if (!preloadNext) return;
    router.prefetch(preloadNext);
  }, [preloadNext, router]);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);

      // Never cover panels while reading — hide chrome the moment scroll starts.
      scrolling.current = true;
      setChromeVisible(false);
      clearHideTimer();
      if (scrollHideTimer.current) clearTimeout(scrollHideTimer.current);
      scrollHideTimer.current = setTimeout(() => {
        scrolling.current = false;
      }, 140);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [clearHideTimer, pages.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "Escape") {
        router.push(mangaHref(mangaId));
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "k") {
        if (prevChapter) router.push(mangaReadHref(mangaId, prevChapter.id));
        return;
      }
      if (e.key === "ArrowRight" || e.key === "j") {
        if (nextChapter) router.push(mangaReadHref(mangaId, nextChapter.id));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mangaId, nextChapter, prevChapter, router]);

  const onPageClick = (e: MouseEvent) => {
    // Ignore clicks that landed on links / buttons inside the reader chrome.
    if ((e.target as HTMLElement).closest("a, button")) return;
    if (scrolling.current) return;

    setChromeVisible((visible) => {
      if (visible) {
        clearHideTimer();
        return false;
      }
      clearHideTimer();
      hideTimer.current = setTimeout(() => setChromeVisible(false), 2600);
      return true;
    });
  };

  return (
    <div className="relative min-h-screen bg-void">
      {/* Hairline progress only — never blocks art */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent"
        aria-hidden
      >
        <div
          className="h-full bg-sakura/90 transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Compact overlay — tap to show, scroll to hide */}
      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))] transition duration-200 ${
          chromeVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-2 opacity-0"
        }`}
      >
        <div
          className={`pointer-events-auto flex max-w-lg items-center gap-2 rounded-full border border-white/10 bg-void/80 px-1.5 py-1 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl ${
            chromeVisible ? "" : "pointer-events-none"
          }`}
        >
          <Link
            href={mangaHref(mangaId)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-cloud transition hover:bg-white/10 hover:text-snow"
            aria-label="Back to series"
            onClick={() => showChromeBriefly()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 6 9 12l6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div className="min-w-0 flex-1 py-0.5 pr-2">
            <p className="truncate text-[0.65rem] leading-tight tracking-[0.1em] text-mute uppercase">
              {mangaTitle}
            </p>
            <p className="truncate text-[0.8rem] font-medium leading-tight tracking-[-0.02em] text-snow">
              {chapterLabel}
            </p>
          </div>
          <span className="shrink-0 pr-2 text-[0.65rem] tabular-nums text-mute">
            {pages.length}
          </span>
        </div>
      </header>

      {/* Full-bleed pages — no reserved chrome padding */}
      <div
        className="relative z-10 mx-auto w-full max-w-[860px]"
        onClick={onPageClick}
        onKeyDown={() => undefined}
        role="presentation"
      >
        <div className="flex flex-col bg-black">
          {pages.map((page, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={page.id}
              src={page.src}
              alt={`${chapterLabel} — page ${i + 1}`}
              width={page.width || 800}
              height={page.height || 1200}
              loading={i < 2 ? "eager" : "lazy"}
              decoding="async"
              referrerPolicy="no-referrer"
              className="block h-auto w-full select-none bg-raised"
              draggable={false}
            />
          ))}
        </div>

        {/* Chapter controls live after the pages — never over them */}
        <div className="border-t border-white/[0.06] px-4 py-12 text-center">
          <p className="text-sm text-mute">End of {chapterLabel}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {prevChapter ? (
              <Link
                href={mangaReadHref(mangaId, prevChapter.id)}
                className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm text-cloud transition hover:border-white/25 hover:text-snow"
                onClick={(e) => e.stopPropagation()}
              >
                ← Previous
              </Link>
            ) : null}
            <Link
              href={mangaHref(mangaId)}
              className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm text-cloud transition hover:border-white/25 hover:text-snow"
              onClick={(e) => e.stopPropagation()}
            >
              Chapters
            </Link>
            {nextChapter ? (
              <Link
                href={mangaReadHref(mangaId, nextChapter.id)}
                className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-void transition hover:bg-sakura-mist"
                onClick={(e) => e.stopPropagation()}
              >
                Next chapter →
              </Link>
            ) : (
              <span className="text-sm text-mute">You&apos;re caught up</span>
            )}
          </div>
          <p className="mt-5 text-[0.7rem] text-mute/80">
            Tip: tap the page for title ·{" "}
            <kbd className="text-cloud">j</kbd>/<kbd className="text-cloud">k</kbd>{" "}
            for chapters · <kbd className="text-cloud">esc</kbd> to leave
          </p>
        </div>
      </div>

      {/* Slim floating chapter hop — only when chrome is open, not a full dock */}
      <nav
        aria-label="Chapter navigation"
        className={`fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] transition duration-200 ${
          chromeVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-void/80 p-1 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          {prevChapter ? (
            <Link
              href={mangaReadHref(mangaId, prevChapter.id)}
              className="inline-flex h-9 items-center rounded-full px-3.5 text-[0.8rem] text-cloud transition hover:bg-white/10 hover:text-snow"
            >
              ← Prev
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center px-3.5 text-[0.8rem] text-mute/40">
              ← Prev
            </span>
          )}
          <Link
            href={mangaHref(mangaId)}
            className="inline-flex h-9 items-center rounded-full px-3.5 text-[0.8rem] text-cloud transition hover:bg-white/10 hover:text-snow"
          >
            Chapters
          </Link>
          {nextChapter ? (
            <Link
              href={mangaReadHref(mangaId, nextChapter.id)}
              className="inline-flex h-9 items-center rounded-full bg-white px-3.5 text-[0.8rem] font-semibold text-void transition hover:bg-sakura-mist"
            >
              Next →
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center px-3.5 text-[0.8rem] text-mute/40">
              Next →
            </span>
          )}
        </div>
      </nav>
    </div>
  );
}
