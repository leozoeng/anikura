"use client";

import Link from "next/link";

type Props = {
  language: "sub" | "dub";
  hasSub: boolean;
  hasDub: boolean;
  subHref: string;
  dubHref: string;
  prevHref?: string;
  nextHref?: string;
};

export function WatchControls({
  language,
  hasSub,
  hasDub,
  subHref,
  dubHref,
  prevHref,
  nextHref,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {(hasSub || hasDub) && (
        <div
          className="inline-flex rounded-full border border-white/12 bg-elevated p-1"
          role="group"
          aria-label="Audio language"
        >
          {hasSub && (
            <Link
              href={subHref}
              className={`rounded-full px-4 py-1.5 text-sm font-medium tracking-[-0.01em] transition ${
                language === "sub"
                  ? "bg-snow text-void shadow-sm"
                  : "text-cloud hover:text-snow"
              }`}
            >
              Sub
            </Link>
          )}
          {hasDub && (
            <Link
              href={dubHref}
              className={`rounded-full px-4 py-1.5 text-sm font-medium tracking-[-0.01em] transition ${
                language === "dub"
                  ? "bg-snow text-void shadow-sm"
                  : "text-cloud hover:text-snow"
              }`}
            >
              Dub
            </Link>
          )}
        </div>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {prevHref && (
          <Link
            href={prevHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-4 py-2 text-sm text-cloud transition hover:border-white/30 hover:text-snow"
          >
            <span aria-hidden>←</span>
            Previous
          </Link>
        )}
        {nextHref && (
          <Link
            href={nextHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-snow px-4 py-2 text-sm font-medium text-void transition hover:bg-white/90"
          >
            Next
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
