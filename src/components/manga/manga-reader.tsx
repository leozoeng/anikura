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
  const [chromeVisible, setChromeVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);

  const chapterLabel = chapter.title || `Chapter ${chapter.number}`;

  const preloadNext = useMemo(
    () => (nextChapter ? mangaReadHref(mangaId, nextChapter.id) : null),
    [mangaId, nextChapter],
  );

  const bumpChrome = useCallback(() => {
    setChromeVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setChromeVisible(false), 3200);
  }, []);

  useEffect(() => {
    saveProgress(mangaId, chapter.id, chapter.number);
    bumpChrome();
    window.scrollTo({ top: 0 });
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [mangaId, chapter.id, chapter.number, bumpChrome]);

  useEffect(() => {
    if (!preloadNext) return;
    router.prefetch(preloadNext);
  }, [preloadNext, router]);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      bumpChrome();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [bumpChrome, pages.length]);

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

  const onPageClick = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      setChromeVisible((v) => !v);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    bumpChrome();
  };

  return (
    <div className="relative min-h-screen bg-void">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-white/10"
        aria-hidden
      >
        <div
          className="h-full bg-sakura transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <header
        className={`fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-void/85 backdrop-blur-xl transition duration-300 ${
          chromeVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-3 pt-[env(safe-area-inset-top)] sm:px-4">
          <Link
            href={mangaHref(mangaId)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-cloud transition hover:bg-white/10 hover:text-snow"
            aria-label="Back to series"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 6 9 12l6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.7rem] tracking-[0.12em] text-mute uppercase">
              {mangaTitle}
            </p>
            <p className="truncate text-sm font-medium tracking-[-0.02em] text-snow">
              {chapterLabel}
            </p>
          </div>
          <span className="shrink-0 text-[0.7rem] tabular-nums text-mute">
            {pages.length} pg
          </span>
        </div>
      </header>

      <div
        className="relative z-10 mx-auto w-full max-w-[860px] pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
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

        <div className="border-t border-white/[0.06] px-4 py-10 text-center">
          <p className="text-sm text-mute">End of {chapterLabel}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {prevChapter ? (
              <Link
                href={mangaReadHref(mangaId, prevChapter.id)}
                className="btn-ghost"
                onClick={(e) => e.stopPropagation()}
              >
                Previous
              </Link>
            ) : null}
            <Link
              href={mangaHref(mangaId)}
              className="btn-ghost"
              onClick={(e) => e.stopPropagation()}
            >
              Series
            </Link>
            {nextChapter ? (
              <Link
                href={mangaReadHref(mangaId, nextChapter.id)}
                className="btn-primary"
                onClick={(e) => e.stopPropagation()}
              >
                Next chapter
              </Link>
            ) : (
              <span className="text-sm text-mute">You&apos;re caught up</span>
            )}
          </div>
        </div>
      </div>

      <nav
        aria-label="Chapter navigation"
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-void/88 backdrop-blur-xl transition duration-300 ${
          chromeVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
          {prevChapter ? (
            <Link
              href={mangaReadHref(mangaId, prevChapter.id)}
              className="btn-ghost flex-1 justify-center !px-3 text-center text-sm"
            >
              ← Prev
            </Link>
          ) : (
            <span className="btn-ghost flex-1 pointer-events-none justify-center !px-3 text-center text-sm opacity-35">
              ← Prev
            </span>
          )}
          <Link
            href={mangaHref(mangaId)}
            className="btn-ghost shrink-0 !px-3 text-sm"
          >
            Chapters
          </Link>
          {nextChapter ? (
            <Link
              href={mangaReadHref(mangaId, nextChapter.id)}
              className="btn-primary flex-1 justify-center !px-3 text-center text-sm"
            >
              Next →
            </Link>
          ) : (
            <span className="btn-primary flex-1 pointer-events-none justify-center !px-3 text-center text-sm opacity-35">
              Next →
            </span>
          )}
        </div>
      </nav>
    </div>
  );
}
