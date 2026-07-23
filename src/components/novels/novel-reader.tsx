"use client";

import { novelHref, novelReadHref } from "@/lib/novelbuddy";
import type { NovelChapter } from "@/lib/novel-types";
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
  novelId: string;
  novelTitle: string;
  chapter: NovelChapter;
  html: string;
  wordCount: number | null;
  readingMinutes: number | null;
  prevChapter: NovelChapter | null;
  nextChapter: NovelChapter | null;
};

const PROGRESS_KEY = "anikura:novel-progress";

function saveProgress(novelId: string, chapterId: string, number: number | null) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    map[novelId] = { chapterId, number, at: Date.now() };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function NovelReader({
  novelId,
  novelTitle,
  chapter,
  html,
  wordCount,
  readingMinutes,
  prevChapter,
  nextChapter,
}: Props) {
  const router = useRouter();
  const [chromeVisible, setChromeVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrolling = useRef(false);
  const scrollHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chapterLabel = chapter.title;
  const preloadNext = useMemo(
    () => (nextChapter ? novelReadHref(novelId, nextChapter.id) : null),
    [novelId, nextChapter],
  );

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  useEffect(() => {
    saveProgress(novelId, chapter.id, chapter.number);
    setChromeVisible(false);
    clearHideTimer();
    window.scrollTo({ top: 0 });
    return () => {
      clearHideTimer();
      if (scrollHideTimer.current) clearTimeout(scrollHideTimer.current);
    };
  }, [novelId, chapter.id, chapter.number, clearHideTimer]);

  useEffect(() => {
    if (!preloadNext) return;
    router.prefetch(preloadNext);
  }, [preloadNext, router]);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
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
  }, [clearHideTimer, html]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "Escape") {
        router.push(novelHref(novelId));
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "k") {
        if (prevChapter) router.push(novelReadHref(novelId, prevChapter.id));
        return;
      }
      if (e.key === "ArrowRight" || e.key === "j") {
        if (nextChapter) router.push(novelReadHref(novelId, nextChapter.id));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [novelId, nextChapter, prevChapter, router]);

  const onSurfaceClick = (e: MouseEvent) => {
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
    <div className="relative min-h-screen bg-void" onClick={onSurfaceClick}>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px]"
        aria-hidden
      >
        <div
          className="h-full bg-sakura/90 transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))] transition duration-200 ${
          chromeVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-2 opacity-0"
        }`}
      >
        <div
          className={`flex max-w-lg items-center gap-2 rounded-full border border-white/10 bg-void/80 px-1.5 py-1 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl ${
            chromeVisible ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <Link
            href={novelHref(novelId)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-cloud transition hover:bg-white/10 hover:text-snow"
            aria-label="Back to novel"
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
              {novelTitle}
            </p>
            <p className="truncate text-[0.8rem] font-medium leading-tight tracking-[-0.02em] text-snow">
              {chapterLabel}
            </p>
          </div>
        </div>
      </header>

      <article className="relative z-10 mx-auto w-full max-w-[42rem] px-5 pb-16 pt-10 sm:px-6 sm:pt-14">
        <header className="mb-10 border-b border-white/[0.06] pb-8">
          <p className="text-[0.7rem] tracking-[0.16em] text-mute uppercase">
            {novelTitle}
          </p>
          <h1 className="mt-2 text-[clamp(1.6rem,4vw,2.15rem)] font-semibold leading-tight tracking-[-0.03em] text-snow">
            {chapterLabel}
          </h1>
          <p className="mt-3 text-[0.78rem] text-mute">
            {readingMinutes ? `~${readingMinutes} min read` : null}
            {readingMinutes && wordCount ? " · " : null}
            {wordCount ? `${wordCount.toLocaleString()} words` : null}
            {!readingMinutes && !wordCount ? "Chapter" : null}
          </p>
        </header>

        <div
          className="novel-prose text-[1.05rem] leading-[1.85] tracking-[-0.01em] text-cloud sm:text-[1.1rem] sm:leading-[1.9]"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="mt-14 border-t border-white/[0.06] px-1 py-12 text-center">
          <p className="text-sm text-mute">End of {chapterLabel}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {prevChapter ? (
              <Link
                href={novelReadHref(novelId, prevChapter.id)}
                className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm text-cloud transition hover:border-white/25 hover:text-snow"
                onClick={(e) => e.stopPropagation()}
              >
                ← Previous
              </Link>
            ) : null}
            <Link
              href={novelHref(novelId)}
              className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm text-cloud transition hover:border-white/25 hover:text-snow"
              onClick={(e) => e.stopPropagation()}
            >
              Chapters
            </Link>
            {nextChapter ? (
              <Link
                href={novelReadHref(novelId, nextChapter.id)}
                className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-void transition hover:bg-sakura-mist"
                onClick={(e) => e.stopPropagation()}
              >
                Next chapter →
              </Link>
            ) : (
              <span className="text-sm text-mute">You&apos;re caught up</span>
            )}
          </div>
        </div>
      </article>

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
              href={novelReadHref(novelId, prevChapter.id)}
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
            href={novelHref(novelId)}
            className="inline-flex h-9 items-center rounded-full px-3.5 text-[0.8rem] text-cloud transition hover:bg-white/10 hover:text-snow"
          >
            Chapters
          </Link>
          {nextChapter ? (
            <Link
              href={novelReadHref(novelId, nextChapter.id)}
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
