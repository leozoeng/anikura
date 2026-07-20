"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getArcForEpisode, getArcsForSeries, type StoryArc } from "@/lib/arcs";
import { decodeEntities } from "@/lib/anilist";
import { watchHref } from "@/lib/anikoto";
import { episodeDisplayTitle } from "@/lib/episode-meta";
import {
  getProgressMapForAnime,
  isEpisodeWatched,
} from "@/lib/progress";
import type { AnimeSummary, Episode } from "@/lib/types";

const CHUNK = 50;

type ViewMode = "grid" | "list";

type ArcContext = {
  malId?: string;
  aniId?: string;
  title?: string;
  slug?: string;
};

type Props = {
  anime: Pick<AnimeSummary, "id" | "slug">;
  episodes: Episode[];
  current: number;
  language: "sub" | "dub";
  arcContext: ArcContext;
  episodeThumbnails?: Record<number, string>;
  fallbackImage?: string;
};

export function EpisodePicker({
  anime,
  episodes,
  current,
  language,
  arcContext,
  episodeThumbnails = {},
  fallbackImage,
}: Props) {
  const [view, setView] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [jump, setJump] = useState("");
  const [progressMap, setProgressMap] = useState<Map<number, number>>(
    new Map(),
  );
  const [arcFilter, setArcFilter] = useState<number | null>(null);

  const maxEp = episodes[episodes.length - 1]?.number ?? 0;
  const arcs = useMemo(
    () => getArcsForSeries(arcContext, maxEp),
    [arcContext, maxEp],
  );
  const currentArc = getArcForEpisode(arcContext, current);

  useEffect(() => {
    setProgressMap(getProgressMapForAnime(anime.id, language));
    const sync = () =>
      setProgressMap(getProgressMapForAnime(anime.id, language));
    window.addEventListener("anikura:progress", sync);
    return () => window.removeEventListener("anikura:progress", sync);
  }, [anime.id, language]);

  const ranges = useMemo(() => {
    if (!episodes.length) return [] as { start: number; end: number }[];
    const nums = episodes.map((e) => e.number);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const list: { start: number; end: number }[] = [];
    for (let start = min; start <= max; start += CHUNK) {
      list.push({ start, end: Math.min(start + CHUNK - 1, max) });
    }
    return list;
  }, [episodes]);

  const rangeForCurrent =
    ranges.find((r) => current >= r.start && current <= r.end) || ranges[0];

  const [rangeStart, setRangeStart] = useState(rangeForCurrent?.start ?? 1);

  useEffect(() => {
    if (rangeForCurrent) setRangeStart(rangeForCurrent.start);
  }, [rangeForCurrent?.start, current]);

  const activeRange =
    ranges.find((r) => r.start === rangeStart) || rangeForCurrent || ranges[0];

  const visibleArcs = useMemo(() => {
    if (!activeRange) return arcs;
    return arcs.filter(
      (a) => a.end >= activeRange.start && a.start <= activeRange.end,
    );
  }, [arcs, activeRange]);

  const visible = useMemo(() => {
    let list = episodes;

    if (arcFilter != null) {
      const arc = arcs.find((a) => a.start === arcFilter);
      if (arc) {
        list = list.filter((e) => e.number >= arc.start && e.number <= arc.end);
      }
    } else if (activeRange && !query) {
      list = list.filter(
        (e) => e.number >= activeRange.start && e.number <= activeRange.end,
      );
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = episodes.filter((e) => {
        const title = decodeEntities(e.title).toLowerCase();
        return String(e.number).includes(q) || title.includes(q);
      });
    }

    return list;
  }, [episodes, activeRange, query, arcFilter, arcs]);

  function onJump(e: FormEvent) {
    e.preventDefault();
    const n = Number(jump);
    if (!Number.isFinite(n) || n < 1) return;
    const target = episodes.find((ep) => ep.number === n);
    if (target) {
      window.location.href = watchHref(anime, n, language);
    }
  }

  function selectArc(arc: StoryArc) {
    setArcFilter((prev) => (prev === arc.start ? null : arc.start));
    setRangeStart(
      ranges.find((r) => arc.start >= r.start && arc.start <= r.end)?.start ??
        arc.start,
    );
  }

  if (!episodes.length) {
    return <p className="text-mute">No episodes available.</p>;
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-elevated/40 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">Episodes</h2>
          <p className="section-sub">
            {episodes.length} total
            {currentArc ? ` · ${currentArc.name}` : ""}
            {activeRange && !query && arcFilter == null
              ? ` · ${activeRange.start}–${activeRange.end}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-white/12 bg-void/50 p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                view === "grid"
                  ? "bg-white/12 text-snow"
                  : "text-mute hover:text-snow"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                view === "list"
                  ? "bg-white/12 text-snow"
                  : "text-mute hover:text-snow"
              }`}
            >
              List
            </button>
          </div>

          <form onSubmit={onJump} className="flex items-center gap-1.5">
            <input
              value={jump}
              onChange={(e) => setJump(e.target.value.replace(/\D/g, ""))}
              placeholder="Go to ep"
              className="w-24 rounded-full border border-white/12 bg-void/50 px-3 py-1.5 text-sm text-snow outline-none placeholder:text-mute focus:border-white/30"
            />
            <button
              type="submit"
              className="rounded-full border border-white/12 px-3 py-1.5 text-xs text-cloud hover:text-snow"
            >
              Go
            </button>
          </form>
        </div>
      </div>

      {visibleArcs.length > 1 && (
        <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1">
          {visibleArcs.map((arc) => {
            const active = arcFilter === arc.start;
            return (
              <button
                key={`${arc.name}-${arc.start}`}
                type="button"
                onClick={() => selectArc(arc)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm tracking-[-0.01em] transition ${
                  active
                    ? "bg-white text-black"
                    : "border border-white/12 text-cloud hover:border-white/30 hover:text-snow"
                }`}
              >
                {arc.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search episode number or title…"
          className="w-full rounded-xl border border-white/10 bg-void/40 px-4 py-2.5 text-sm text-snow outline-none placeholder:text-mute focus:border-white/25"
        />
      </div>

      {!query && arcFilter == null && ranges.length > 1 && (
        <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1">
          {ranges.map((r) => {
            const active = r.start === activeRange?.start;
            return (
              <button
                key={`${r.start}-${r.end}`}
                type="button"
                onClick={() => setRangeStart(r.start)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm tracking-[-0.01em] transition ${
                  active
                    ? "bg-white text-black"
                    : "border border-white/12 text-cloud hover:border-white/30 hover:text-snow"
                }`}
              >
                {r.start}–{r.end}
              </button>
            );
          })}
        </div>
      )}

      {view === "grid" ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((e) => {
            const isActive = e.number === current;
            const pct = progressMap.get(e.number) ?? 0;
            const watched = isEpisodeWatched(pct);
            const label = episodeDisplayTitle(e);
            const thumb =
              episodeThumbnails[e.number] || fallbackImage || undefined;

            return (
              <Link
                key={e.id}
                href={watchHref(anime, e.number, language)}
                className={`group relative overflow-hidden rounded-xl ring-1 transition ${
                  isActive
                    ? "ring-2 ring-snow"
                    : "ring-white/8 hover:ring-white/20"
                }`}
              >
                <div className="relative aspect-video bg-raised">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
                        watched && !isActive ? "opacity-55" : ""
                      }`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-raised" />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-snow/90 backdrop-blur-sm">
                    Ep {e.number}
                  </span>
                  {pct > 0 && pct < 90 && (
                    <span className="absolute inset-x-0 bottom-0 block h-0.5 bg-white/15">
                      <span
                        className="block h-full bg-snow/80"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  )}
                </div>
                <div className="bg-elevated/80 px-2.5 py-2">
                  <p className="truncate text-xs font-medium tracking-[-0.01em] text-snow">
                    {label}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 max-h-[420px] divide-y divide-white/6 overflow-y-auto rounded-xl border border-white/6">
          {visible.map((e) => {
            const isActive = e.number === current;
            const label = episodeDisplayTitle(e);
            const pct = progressMap.get(e.number) ?? 0;
            const watched = isEpisodeWatched(pct);
            const thumb =
              episodeThumbnails[e.number] || fallbackImage || undefined;
            return (
              <Link
                key={e.id}
                href={watchHref(anime, e.number, language)}
                className={`flex items-center gap-3 px-3 py-2.5 transition hover:bg-white/[0.04] ${
                  isActive ? "bg-white/[0.06]" : ""
                }`}
              >
                <span className="relative h-12 w-[84px] shrink-0 overflow-hidden rounded-md bg-raised">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className={`h-full w-full object-cover ${
                        watched && !isActive ? "opacity-55" : ""
                      }`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                </span>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-medium ${
                    isActive ? "bg-white text-black" : "bg-raised text-cloud"
                  }`}
                >
                  {e.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm tracking-[-0.01em] ${
                      watched && !isActive ? "text-cloud" : "text-snow"
                    }`}
                  >
                    {label}
                  </span>
                  {pct > 0 && pct < 90 && (
                    <span className="mt-1 block h-0.5 max-w-[120px] rounded-full bg-white/15">
                      <span
                        className="block h-full rounded-full bg-white/70"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </span>
                  )}
                </span>
                {isActive ? (
                  <span className="text-xs text-mute">Playing</span>
                ) : watched ? (
                  <span className="text-xs text-mute">Watched</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
