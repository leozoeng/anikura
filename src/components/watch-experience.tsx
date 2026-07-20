"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AutoplayNext } from "@/components/autoplay-next";
import { EpisodePicker } from "@/components/episode-picker";
import { MiniPlayer } from "@/components/mini-player";
import { MyListButton } from "@/components/my-list-button";
import { VideoPlayer } from "@/components/video-player";
import { WatchControls } from "@/components/watch-controls";
import { WatchKeyboard } from "@/components/watch-keyboard";
import { WatchProgressTracker } from "@/components/watch-progress-tracker";
import { WatchTabs } from "@/components/watch-tabs";
import { decodeEntities } from "@/lib/anilist";
import { animeHref, watchHref } from "@/lib/anikoto";
import { getArcForEpisode } from "@/lib/arcs";
import type { EmbedServer } from "@/lib/embeds";
import {
  getEpisodeProgress,
  getWatchSettings,
  saveWatchSettings,
} from "@/lib/progress";
import type { AnimeSummary, Episode } from "@/lib/types";

const PLAYER_ID = "watch-player";

type Recommendation = {
  media: {
    id: number;
    title: { english?: string | null; romaji?: string | null };
    coverImage?: { large?: string | null } | null;
  };
  match: { id: number; slug: string; poster: string };
};

type Props = {
  anime: AnimeSummary;
  episodes: Episode[];
  current: Episode;
  language: "sub" | "dub";
  servers: EmbedServer[];
  preferredServerId?: string | null;
  watchBase: string;
  showTitle: string;
  episodeTitle: string;
  score?: string | null;
  year?: number | null;
  genre?: string | null;
  shortSynopsis: string;
  poster: string;
  banner: string;
  episodeThumbnails?: Record<number, string>;
  anilistMeta: {
    studios?: string;
    genres?: string;
    status?: string;
    totalEps?: string;
  };
  recommendations: Recommendation[];
  arcContext: {
    malId?: string;
    aniId?: string;
    title?: string;
    slug?: string;
  };
  prevHref?: string;
  nextHref?: string;
  nextTitle?: string;
  hasSub: boolean;
  hasDub: boolean;
  durationMin?: number;
};

export function WatchExperience(props: Props) {
  const {
    anime,
    episodes,
    current,
    language,
    servers,
    preferredServerId,
    watchBase,
    showTitle,
    episodeTitle,
    score,
    year,
    genre,
    shortSynopsis,
    poster,
    banner,
    episodeThumbnails = {},
    anilistMeta,
    recommendations,
    arcContext,
    prevHref,
    nextHref,
    nextTitle,
    hasSub,
    hasDub,
    durationMin,
  } = props;

  const [settings, setSettings] = useState(getWatchSettings);
  const [autoplayArmed, setAutoplayArmed] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);

  const currentArc = getArcForEpisode(arcContext, current.number);

  useEffect(() => {
    setProgressPct(getEpisodeProgress(anime.id, current.number, language));
    const sync = () =>
      setProgressPct(getEpisodeProgress(anime.id, current.number, language));
    window.addEventListener("anikura:progress", sync);
    return () => window.removeEventListener("anikura:progress", sync);
  }, [anime.id, current.number, language]);

  useEffect(() => {
    if (settings.autoplayNext) setAutoplayArmed(true);
    else setAutoplayArmed(false);
  }, [settings.autoplayNext, current.number]);

  useEffect(() => {
    document.body.dataset.theater = settings.theaterMode ? "true" : "false";
    return () => {
      delete document.body.dataset.theater;
    };
  }, [settings.theaterMode]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "t" || e.key === "T") {
        if (e.metaKey || e.ctrlKey || !e.shiftKey) {
          e.preventDefault();
          const next = saveWatchSettings({
            theaterMode: !getWatchSettings().theaterMode,
          });
          setSettings(next);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleTheater() {
    const next = saveWatchSettings({ theaterMode: !settings.theaterMode });
    setSettings(next);
  }

  function toggleAutoplay() {
    const next = saveWatchSettings({ autoplayNext: !settings.autoplayNext });
    setSettings(next);
  }

  return (
    <div
      className={`min-h-screen pb-24 ${settings.theaterMode ? "pt-0" : ""}`}
    >
      <WatchProgressTracker
        id={anime.id}
        slug={anime.slug}
        title={anime.title}
        poster={anime.poster}
        episode={current.number}
        language={language}
        durationMin={durationMin}
      />
      <WatchKeyboard prevHref={prevHref} nextHref={nextHref} />

      <AutoplayNext
        nextHref={nextHref}
        nextLabel={nextTitle}
        enabled={settings.autoplayNext}
        armed={autoplayArmed}
        onArm={() => setAutoplayArmed(true)}
      />

      <MiniPlayer
        title={showTitle}
        episode={current.number}
        episodeTitle={episodeTitle}
        poster={poster}
        watchHref={watchHref(anime, current.number, language)}
        playerAnchorId={PLAYER_ID}
      />

      {/* Backdrop */}
      {!settings.theaterMode && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(70vh,520px)] overflow-hidden">
          <Image
            src={banner}
            alt=""
            fill
            className="object-cover opacity-25 blur-3xl"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-void/20 via-void/80 to-void" />
        </div>
      )}

      <div
        className={`relative ${
          settings.theaterMode
            ? "fixed inset-0 z-[100] flex flex-col bg-void"
            : "pt-14"
        }`}
      >
        <div
          className={`${
            settings.theaterMode
              ? "flex flex-1 flex-col justify-center px-4 py-6 sm:px-8"
              : "mx-auto max-w-[1100px] px-5 sm:px-8"
          }`}
        >
          {!settings.theaterMode && (
            <nav className="flex flex-wrap items-center gap-3 py-4 text-sm text-mute">
              <Link href={animeHref(anime)} className="hover:text-snow">
                ← {showTitle}
              </Link>
            </nav>
          )}

          <div id={PLAYER_ID} ref={playerRef}>
            <VideoPlayer
              title={`${showTitle} episode ${current.number}`}
              servers={servers}
              preferredServerId={preferredServerId || null}
              watchBasePath={watchBase}
              language={language}
              episode={current.number}
            />
          </div>

          {/* Watch toolbar */}
          <div
            className={`mt-4 flex flex-wrap items-center gap-2 ${
              settings.theaterMode ? "justify-center" : ""
            }`}
          >
            <button
              type="button"
              onClick={toggleTheater}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                settings.theaterMode
                  ? "border-white/30 bg-white/10 text-snow"
                  : "border-white/12 text-cloud hover:text-snow"
              }`}
            >
              {settings.theaterMode ? "Exit theater" : "Theater mode"}
            </button>
            <button
              type="button"
              onClick={toggleAutoplay}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                settings.autoplayNext
                  ? "border-white/30 bg-white/10 text-snow"
                  : "border-white/12 text-cloud hover:text-snow"
              }`}
            >
              Autoplay {settings.autoplayNext ? "on" : "off"}
            </button>
            <MyListButton
              id={anime.id}
              slug={anime.slug}
              title={anime.title}
              poster={anime.poster}
              className="!bg-elevated !opacity-100"
            />
          </div>

          {progressPct > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-mute">
                <span>Watch progress</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-snow transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {!settings.theaterMode && (
            <>
              <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 gap-4">
                  <Link
                    href={animeHref(anime)}
                    className="relative hidden h-24 w-[68px] shrink-0 overflow-hidden rounded-xl ring-1 ring-white/12 sm:block"
                  >
                    <Image
                      src={poster}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="68px"
                    />
                  </Link>
                  <div className="min-w-0">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-mute">
                      Now playing
                      {currentArc ? ` · ${currentArc.name}` : ""}
                    </p>
                    <h1 className="mt-1 text-[clamp(1.35rem,3vw,2rem)] font-semibold tracking-[-0.04em]">
                      Episode {current.number}
                      {episodeTitle && (
                        <span className="text-cloud"> · {episodeTitle}</span>
                      )}
                    </h1>
                    <p className="mt-2 text-sm text-mute">
                      {showTitle}
                      {score && ` · ${score}`}
                      {year && ` · ${year}`}
                      {genre && ` · ${genre}`}
                    </p>
                    <p className="mt-2 hidden text-xs text-mute/80 sm:block">
                      ← → or J / K · Theater ⌘+T
                    </p>
                  </div>
                </div>

                <WatchControls
                  language={language}
                  hasSub={hasSub}
                  hasDub={hasDub}
                  subHref={watchHref(anime, current.number, "sub")}
                  dubHref={watchHref(anime, current.number, "dub")}
                  prevHref={prevHref}
                  nextHref={nextHref}
                />
              </div>

              {nextHref && (
                <Link
                  href={nextHref}
                  className="mt-6 flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/18 hover:bg-white/[0.05]"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-raised text-base font-semibold">
                    {current.number + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.12em] text-mute">
                      Up next
                    </p>
                    <p className="truncate text-sm font-medium tracking-[-0.02em]">
                      {nextTitle}
                    </p>
                  </div>
                  <span className="text-sm text-cloud">Play →</span>
                </Link>
              )}
            </>
          )}
        </div>

        {settings.theaterMode && (
          <div className="border-t border-white/8 px-5 py-4 text-center sm:px-8">
            <p className="text-sm text-cloud">
              {showTitle} · Episode {current.number}
              {episodeTitle && ` · ${episodeTitle}`}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <WatchControls
                language={language}
                hasSub={hasSub}
                hasDub={hasDub}
                subHref={watchHref(anime, current.number, "sub")}
                dubHref={watchHref(anime, current.number, "dub")}
                prevHref={prevHref}
                nextHref={nextHref}
              />
            </div>
          </div>
        )}
      </div>

      {!settings.theaterMode && (
        <div className="relative mx-auto mt-14 max-w-[1100px] px-5 sm:px-8">
          <WatchTabs
            defaultTab="episodes"
            tabs={[
              {
                id: "episodes",
                label: "Episodes",
                content: (
                  <EpisodePicker
                    anime={anime}
                    episodes={episodes}
                    current={current.number}
                    language={language}
                    arcContext={arcContext}
                    episodeThumbnails={episodeThumbnails}
                    fallbackImage={banner || poster}
                  />
                ),
              },
              {
                id: "about",
                label: "About",
                content: (
                  <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
                    <div>
                      {shortSynopsis && (
                        <p className="text-[1.02rem] leading-relaxed text-cloud">
                          {shortSynopsis}
                        </p>
                      )}
                      <Link
                        href={animeHref(anime)}
                        className="mt-5 inline-flex text-sm text-apple-blue hover:underline"
                      >
                        Full series page
                      </Link>
                    </div>
                    <dl className="space-y-4 text-sm">
                      <Meta label="Studios" value={anilistMeta.studios} />
                      <Meta label="Genres" value={anilistMeta.genres} />
                      <Meta label="Status" value={anilistMeta.status} />
                      <Meta label="Total episodes" value={anilistMeta.totalEps} />
                    </dl>
                  </div>
                ),
              },
              ...(recommendations.length
                ? [
                    {
                      id: "similar",
                      label: "More like this",
                      content: (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                          {recommendations.map(({ media, match }) => (
                            <Link
                              key={media.id}
                              href={`/anime/${match.id}/${match.slug}`}
                              className="group"
                            >
                              <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-raised ring-1 ring-white/8 transition group-hover:-translate-y-0.5 group-hover:ring-white/25">
                                <Image
                                  src={media.coverImage?.large || match.poster}
                                  alt={
                                    media.title.english ||
                                    media.title.romaji ||
                                    ""
                                  }
                                  fill
                                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                                  sizes="160px"
                                />
                              </div>
                              <p className="mt-2 line-clamp-2 text-sm tracking-[-0.02em]">
                                {media.title.english || media.title.romaji}
                              </p>
                            </Link>
                          ))}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-mute">{label}</dt>
      <dd className="mt-1 text-cloud">{value}</dd>
    </div>
  );
}
