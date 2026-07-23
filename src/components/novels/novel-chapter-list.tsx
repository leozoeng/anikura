"use client";

import { novelReadHref } from "@/lib/novelbuddy";
import type { NovelChapter } from "@/lib/novel-types";
import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  novelId: string;
  chapters: NovelChapter[];
};

const PAGE_SIZE = 60;

export function NovelChapterList({ novelId, chapters }: Props) {
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = chapters;
    if (q) {
      list = list.filter(
        (ch) =>
          String(ch.number ?? "").includes(q) ||
          ch.title.toLowerCase().includes(q),
      );
    }
    return order === "desc" ? [...list].reverse() : list;
  }, [chapters, order, query]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">Chapters</p>
          <h2 className="section-title">
            {chapters.length.toLocaleString()} available
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="novel-chapter-search">
            Search chapters
          </label>
          <input
            id="novel-chapter-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Find chapter…"
            className="h-10 w-40 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-snow outline-none placeholder:text-mute focus:border-sakura/40 sm:w-48"
          />
          <div
            className="filter-rail !mt-0"
            role="tablist"
            aria-label="Chapter order"
          >
            {(
              [
                { id: "desc", label: "Newest" },
                { id: "asc", label: "Oldest" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={order === opt.id}
                onClick={() => {
                  setOrder(opt.id);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`filter-pill ${order === opt.id ? "is-active" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-mute">No chapters match that search.</p>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-white/[0.06] overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-white/[0.02]">
            {visible.map((chapter) => (
              <li key={chapter.id}>
                <Link
                  href={novelReadHref(novelId, chapter.id)}
                  className="pressable flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-white/[0.04] sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[0.95rem] font-medium tracking-[-0.02em] text-snow">
                      {chapter.title}
                    </p>
                    <p className="mt-0.5 text-[0.72rem] text-mute">
                      {chapter.updatedAt
                        ? new Date(chapter.updatedAt).toLocaleDateString()
                        : "Chapter"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-sakura-soft/80">
                    Read
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {hasMore ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                Show more chapters
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
