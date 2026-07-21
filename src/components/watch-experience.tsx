"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimeComments } from "@/components/anime-comments";
import { AutoplayNext } from "@/components/autoplay-next";
import { ExpandableText } from "@/components/expandable-text";
import { MiniPlayer } from "@/components/mini-player";
import { VideoPlayer } from "@/components/video-player";
import { WatchControls } from "@/components/watch-controls";
import { WatchKeyboard } from "@/components/watch-keyboard";
import { WatchProgressTracker } from "@/components/watch-progress-tracker";
import { WatchSidebar } from "@/components/watch-sidebar";
import { animeHref, watchHref } from "@/lib/anikoto";
import { getArcForEpisode } from "@/lib/arcs";
import type { EmbedServer } from "@/lib/embeds";
import { getWatchSettings, saveWatchSettings } from "@/lib/progress";
import type {
  RelatedEntry,
  RelatedMediaCard,
  SeasonEntry,
} from "@/lib/related";
import type { AnimeSummary, Episode } from "@/lib/types";

const PLAYER_ID = "watch-player";
const TIP_DISMISS_KEY = "anikura:watch-server-tip-dismissed";

function subscribeLg(cb: () => void) {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeLg,
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  );
}

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
  /** Episode-specific overview when available (not the series synopsis). */
  episodeDescription?: string;
  poster: string;
  banner: string;
  episodeThumbnails?: Record<number, string>;
  anilistMeta: {
    studios?: string;
    genres?: string;
    status?: string;
    totalEps?: string;
  };
  related: RelatedEntry[];
  seasons: SeasonEntry[];
  recommendations: RelatedMediaCard[];
  arcContext: {
    malId?: string;
    aniId?: string;
    title?: string;
    slug?: string;
  };
  prevHref?: string;
  nextHref?: string;
  nextTitle?: string;
  nextAirLabel?: string | null;
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
    episodeDescription = "",
    poster,
    banner,
    episodeThumbnails = {},
    anilistMeta,
    related,
    seasons,
    recommendations,
    arcContext,
    prevHref,
    nextHref,
    nextTitle,
    nextAirLabel,
    hasSub,
    hasDub,
    durationMin,
  } = props;

  const [settings, setSettings] = useState(getWatchSettings);
  const [autoplayArmed, setAutoplayArmed] = useState(false);
  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const [tipVisible, setTipVisible] = useState(true);
  const playerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();

  const currentArc = getArcForEpisode(arcContext, current.number);
  const displayEpisodeTitle =
    episodeTitle || `Episode ${current.number}`;

  const comments = (
    <AnimeComments
      animeId={anime.id}
      episode={current.number}
      language={language}
      returnPath={watchHref(anime, current.number, language)}
      className="min-w-0"
    />
  );
  useEffect(() => {
    try {
      if (localStorage.getItem(TIP_DISMISS_KEY) === "1") setTipVisible(false);
    } catch {
      /* ignore */
    }
  }, []);

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

  function dismissTip() {
    setTipVisible(false);
    try {
      localStorage.setItem(TIP_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function sharePage() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: displayEpisodeTitle, url });
        return;
      }
    } catch {
      /* fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  }

  const metaBits = [
    `Episode ${current.number}`,
    language === "dub" ? "Dub" : "Sub",
    score ? `★ ${score}` : null,
    year ? String(year) : null,
    genre,
    currentArc?.name,
  ].filter(Boolean);

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
        episodeTitle={displayEpisodeTitle}
        poster={poster}
        watchHref={watchHref(anime, current.number, language)}
        playerAnchorId={PLAYER_ID}
      />

      {!settings.theaterMode && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(70vh,520px)] overflow-hidden">
          <Image
            src={banner}
            alt=""
            fill
            className="object-cover opacity-20 blur-3xl"
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
        {settings.theaterMode ? (
          <div className="flex flex-1 flex-col justify-center px-4 py-6 sm:px-8">
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
            <div className="mt-4 border-t border-white/8 px-1 py-4 text-center">
              <p className="text-sm text-cloud">
                {showTitle} · Episode {current.number}
                {episodeTitle && ` · ${episodeTitle}`}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <WatchControls
                  animeId={anime.id}
                  episode={current.number}
                  language={language}
                  hasSub={hasSub}
                  hasDub={hasDub}
                  subHref={watchHref(anime, current.number, "sub")}
                  dubHref={watchHref(anime, current.number, "dub")}
                  onShare={() => void sharePage()}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = saveWatchSettings({ theaterMode: false });
                    setSettings(next);
                  }}
                  className="rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-black"
                >
                  Exit theater
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-8">
            <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-mute">
              <Link
                href="/"
                aria-label="Home"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/8 hover:text-snow"
              >
                <HomeIcon />
              </Link>
              <Chevron />
              <Link
                href={animeHref(anime)}
                className="max-w-[min(40vw,280px)] truncate hover:text-snow"
              >
                {showTitle}
              </Link>
              <Chevron />
              <span className="text-cloud">Episode {current.number}</span>
            </nav>

            {/* Desktop: comments nested under description (avoids sidebar-height gap). Mobile: episodes then comments. */}
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">
                <div id={PLAYER_ID} ref={playerRef} className="-mx-4 sm:mx-0">
                  <VideoPlayer
                    title={`${showTitle} episode ${current.number}`}
                    servers={servers}
                    preferredServerId={preferredServerId || null}
                    watchBasePath={watchBase}
                    language={language}
                    episode={current.number}
                    hideToolbar
                    menuOpen={serverMenuOpen}
                    onMenuOpenChange={setServerMenuOpen}
                  />
                </div>

                {tipVisible && (
                  <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-raised/70 px-3.5 py-2.5 text-sm text-cloud">
                    <InfoIcon />
                    <p className="min-w-0 flex-1 leading-snug">
                      If the current server doesn&apos;t work, feel free to try
                      the other available servers.
                    </p>
                    <button
                      type="button"
                      aria-label="Dismiss tip"
                      onClick={dismissTip}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mute transition hover:bg-white/10 hover:text-snow"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="mt-5 space-y-4">
                  <div>
                    <h1 className="text-[clamp(1.35rem,3vw,1.9rem)] font-semibold leading-tight tracking-[-0.04em] text-snow">
                      {displayEpisodeTitle}
                    </h1>
                    <p className="mt-1.5 text-sm text-mute">
                      {metaBits.join(" · ")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={animeHref(anime)}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15">
                        <Image
                          src={poster}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold tracking-[-0.02em] text-snow">
                          {showTitle}
                        </span>
                        <span className="block text-xs text-mute">
                          {anilistMeta.totalEps
                            ? `${anilistMeta.totalEps} episodes`
                            : "Series"}
                        </span>
                      </span>
                    </Link>
                  </div>

                  <WatchControls
                    animeId={anime.id}
                    episode={current.number}
                    language={language}
                    hasSub={hasSub}
                    hasDub={hasDub}
                    subHref={watchHref(anime, current.number, "sub")}
                    dubHref={watchHref(anime, current.number, "dub")}
                    onServer={() => setServerMenuOpen((o) => !o)}
                    onShare={() => void sharePage()}
                  />

                  {episodeDescription ? (
                    <ExpandableText
                      text={episodeDescription}
                      limit={180}
                      textClassName="text-sm leading-relaxed text-cloud"
                    />
                  ) : null}
                </div>

                {isDesktop ? <div className="mt-8">{comments}</div> : null}
              </div>

              <WatchSidebar
                anime={anime}
                showTitle={showTitle}
                episodes={episodes}
                current={current.number}
                language={language}
                episodeThumbnails={episodeThumbnails}
                fallbackImage={banner || poster}
                recommendations={recommendations}
                related={related}
                seasons={seasons}
                nextAirLabel={nextAirLabel}
                className="min-w-0 self-start"
              />

              {!isDesktop ? comments : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <span className="text-mute/70" aria-hidden>
      ›
    </span>
  );
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 7.5 8 2.5l5.5 5M4 6.8V13h3.2V9.5h1.6V13H12V6.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="mt-0.5 shrink-0 text-mute"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 7.2V11M8 5.2v.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
