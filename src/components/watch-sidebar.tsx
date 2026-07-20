"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { decodeEntities } from "@/lib/anilist";
import { watchHref } from "@/lib/anikoto";
import type { AnimeSummary, Episode } from "@/lib/types";

type Recommendation = {
  media: {
    id: number;
    title: { english?: string | null; romaji?: string | null };
    coverImage?: { large?: string | null } | null;
    seasonYear?: number | null;
  };
  match: { id: number; slug: string; poster: string };
};

type Props = {
  anime: Pick<AnimeSummary, "id" | "slug">;
  showTitle: string;
  episodes: Episode[];
  current: number;
  language: "sub" | "dub";
  episodeThumbnails?: Record<number, string>;
  fallbackImage?: string;
  recommendations: Recommendation[];
  nextAirLabel?: string | null;
};

export function WatchSidebar({
  anime,
  showTitle,
  episodes,
  current,
  language,
  episodeThumbnails = {},
  fallbackImage,
  recommendations,
  nextAirLabel,
}: Props) {
  const [query, setQuery] = useState("");
  const [reversed, setReversed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [compact, setCompact] = useState(false);

  const visible = useMemo(() => {
    let list = [...episodes];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const title = decodeEntities(e.title).toLowerCase();
        return String(e.number).includes(q) || title.includes(q);
      });
    }
    if (reversed) list.reverse();
    return list;
  }, [episodes, query, reversed]);

  return (
    <aside className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-elevated/60">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        >
          <span>
            <span className="block text-base font-semibold tracking-[-0.03em] text-snow">
              Episodes
            </span>
            <span className="mt-0.5 block truncate text-xs text-mute">
              Playing · Episode {current} · {showTitle}
            </span>
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className={`shrink-0 text-mute transition ${collapsed ? "rotate-180" : ""}`}
          >
            <path
              d="M4 10 8 6l4 4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {!collapsed && (
          <div className="border-t border-white/8 px-3 pb-3 pt-3">
            <div className="flex items-center gap-1.5">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search episode</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Episode"
                  className="w-full rounded-xl border border-white/10 bg-raised px-3.5 py-2.5 text-sm text-snow outline-none placeholder:text-mute focus:border-white/25"
                />
              </label>
              <UtilButton
                label="Clear search"
                onClick={() => setQuery("")}
              >
                <RefreshIcon />
              </UtilButton>
              <UtilButton
                label={reversed ? "Oldest first" : "Newest first"}
                onClick={() => setReversed((v) => !v)}
                active={reversed}
              >
                <SortIcon />
              </UtilButton>
              <UtilButton
                label={compact ? "Detailed list" : "Compact list"}
                onClick={() => setCompact((v) => !v)}
                active={compact}
              >
                <ViewIcon />
              </UtilButton>
            </div>

            <div className="mt-3 max-h-[min(52vh,520px)] space-y-1 overflow-y-auto pr-1">
              {visible.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-mute">
                  No Episodes Found :(
                </p>
              ) : (
                visible.map((ep) => {
                  const isActive = ep.number === current;
                  const raw = decodeEntities(ep.title);
                  const label =
                    raw && raw !== `Episode ${ep.number}`
                      ? raw
                      : `Episode ${ep.number}`;
                  const thumb = episodeThumbnails[ep.number] || fallbackImage;

                  return (
                    <Link
                      key={ep.id}
                      href={watchHref(anime, ep.number, language)}
                      className={`flex gap-3 rounded-xl p-2 transition ${
                        isActive
                          ? "bg-white/[0.08] ring-1 ring-white/12"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      {!compact && (
                        <span className="relative aspect-video w-[108px] shrink-0 overflow-hidden rounded-lg bg-raised">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                          <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-snow backdrop-blur-sm">
                            Ep {ep.number}
                          </span>
                        </span>
                      )}
                      <span className="min-w-0 flex-1 py-0.5">
                        {compact && (
                          <span className="mb-0.5 block text-[11px] font-medium text-mute">
                            Ep {ep.number}
                          </span>
                        )}
                        <span className="line-clamp-2 text-sm font-medium leading-snug tracking-[-0.02em] text-snow">
                          {label}
                        </span>
                        {isActive && (
                          <span className="mt-1 block text-xs text-mute">
                            Playing
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {nextAirLabel && (
        <div className="inline-flex items-center gap-2 self-start rounded-full bg-raised px-3.5 py-2 text-xs font-medium text-cloud ring-1 ring-white/10">
          <span aria-hidden>🔔</span>
          {nextAirLabel}
        </div>
      )}

      {recommendations.length > 0 && (
        <div>
          <h3 className="text-base font-semibold tracking-[-0.02em] text-snow">
            More like this
          </h3>
          <ul className="mt-3 space-y-3">
            {recommendations.map(({ media, match }) => {
              const title =
                media.title.english || media.title.romaji || "Untitled";
              const poster = media.coverImage?.large || match.poster;
              return (
                <li key={media.id}>
                  <Link
                    href={`/anime/${match.id}/${match.slug}`}
                    className="flex gap-3 rounded-xl p-1.5 transition hover:bg-white/[0.04]"
                  >
                    <span className="relative h-[72px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-raised">
                      <Image
                        src={poster}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="52px"
                      />
                    </span>
                    <span className="min-w-0 flex-1 py-1">
                      <span className="line-clamp-2 text-sm font-medium leading-snug tracking-[-0.02em] text-snow">
                        {title}
                      </span>
                      <span className="mt-1 block text-xs text-mute">
                        TV
                        {media.seasonYear ? ` · ${media.seasonYear}` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
}

function UtilButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 transition ${
        active
          ? "bg-white/12 text-snow ring-white/20"
          : "bg-raised text-cloud ring-white/10 hover:text-snow"
      }`}
    >
      {children}
    </button>
  );
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M13.5 8A5.5 5.5 0 1 1 11.2 3.4M13.5 8V3.5H9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M5 3v10M5 13 2.5 10.5M5 13l2.5-2.5M11 13V3M11 3l2.5 2.5M11 3 8.5 5.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 4h11M2.5 8h11M2.5 12h11"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
