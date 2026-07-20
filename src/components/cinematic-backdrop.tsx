"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  isTrailerMuted,
  setTrailerMuted,
  TRAILER_VOLUME,
} from "@/lib/trailer-audio";

type YTPlayer = {
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  destroy: () => void;
  playVideo: () => void;
  getPlayerState?: () => number;
  setPlaybackQuality?: (quality: string) => void;
  setPlaybackQualityRange?: (min: string, max: string) => void;
  getIframe?: () => HTMLIFrameElement;
};

type YTPlayerConstructor = new (
  element: HTMLElement | string,
  options: {
    videoId: string;
    width?: string | number;
    height?: string | number;
    host?: string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (event: { target: YTPlayer }) => void;
      onStateChange?: (event: { data: number; target: YTPlayer }) => void;
    };
  },
) => YTPlayer;

declare global {
  interface Window {
    YT?: { Player: YTPlayerConstructor };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;
/**
 * Extra wait after PLAYING before revealing the trailer.
 * YouTube often flashes large center prev/pause/next + title chrome
 * for ~1–2s after autoplay starts even with controls:0.
 */
const CHROME_CLEAR_MS = 2400;
/** Home hero: hold the HD banner before fading into the trailer */
const DEFAULT_BANNER_HOLD_MS = 0;

let apiPromise: Promise<void> | null = null;

function loadYouTubeAPI() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const done = () => resolve();
    if (window.YT?.Player) {
      done();
      return;
    }
    window.onYouTubeIframeAPIReady = done;
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
  return apiPromise;
}

function preferHd(player: YTPlayer) {
  try {
    player.setPlaybackQualityRange?.("hd720", "highres");
    player.setPlaybackQuality?.("hd1080");
  } catch {
    // YouTube may ignore quality hints depending on client.
  }
}

type Props = {
  videoId?: string | null;
  posterSrc: string;
  title: string;
  children?: ReactNode;
  className?: string;
  minHeightClass?: string;
  posterClassName?: string;
  scale?: number;
  showAudioToggle?: boolean;
  /**
   * Home: poster covers chrome, then crossfades into the trailer.
   * Detail: solid void cover only — no banner under/over the trailer.
   */
  coverMode?: "poster" | "solid";
  /** Milliseconds to show the HD banner before fading into the trailer (home). */
  bannerHoldMs?: number;
};

export function CinematicBackdrop({
  videoId,
  posterSrc,
  title,
  children,
  className = "",
  minHeightClass = "min-h-[100svh]",
  posterClassName = "",
  scale = 1.65,
  showAudioToggle = true,
  coverMode = "poster",
  bannerHoldMs = DEFAULT_BANNER_HOLD_MS,
}: Props) {
  const mountId = useId().replace(/:/g, "");
  const playerRef = useRef<YTPlayer | null>(null);
  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chromeScheduled = useRef(false);
  const [playbackReady, setPlaybackReady] = useState(false);
  const [holdDone, setHoldDone] = useState(bannerHoldMs <= 0);
  const [muted, setMuted] = useState(false);
  const [hasTrailer, setHasTrailer] = useState(Boolean(videoId));
  const [reducedMotion, setReducedMotion] = useState(false);

  const applyAudio = useCallback((player: YTPlayer, shouldMute: boolean) => {
    if (shouldMute) {
      player.mute();
    } else {
      player.unMute();
      player.setVolume(TRAILER_VOLUME);
    }
  }, []);

  const clearChromeTimer = useCallback(() => {
    if (chromeTimer.current) {
      clearTimeout(chromeTimer.current);
      chromeTimer.current = null;
    }
  }, []);

  const clearHoldTimer = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const schedulePlaybackReady = useCallback(
    (cancelled: () => boolean) => {
      if (chromeScheduled.current) return;
      chromeScheduled.current = true;
      clearChromeTimer();
      chromeTimer.current = setTimeout(() => {
        if (cancelled()) return;
        setPlaybackReady(true);
        chromeTimer.current = null;
      }, CHROME_CLEAR_MS);
    },
    [clearChromeTimer],
  );

  const hideChromeAgain = useCallback(() => {
    clearChromeTimer();
    chromeScheduled.current = false;
    setPlaybackReady(false);
  }, [clearChromeTimer]);

  useEffect(() => {
    setMuted(isTrailerMuted());
    const sync = () => setMuted(isTrailerMuted());
    window.addEventListener("anikura:trailer-audio", sync);
    return () => window.removeEventListener("anikura:trailer-audio", sync);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Fresh slide: show HD banner for bannerHoldMs, load trailer underneath
  useEffect(() => {
    setHasTrailer(Boolean(videoId) && !reducedMotion);
    setPlaybackReady(false);
    chromeScheduled.current = false;
    clearChromeTimer();
    clearHoldTimer();

    if (bannerHoldMs <= 0 || reducedMotion || !videoId) {
      setHoldDone(true);
      return;
    }

    setHoldDone(false);
    holdTimer.current = setTimeout(() => {
      setHoldDone(true);
      holdTimer.current = null;
    }, bannerHoldMs);

    return () => clearHoldTimer();
  }, [videoId, reducedMotion, bannerHoldMs, clearChromeTimer, clearHoldTimer]);

  useEffect(() => {
    if (!hasTrailer || !videoId) return;

    let cancelled = false;
    const isCancelled = () => cancelled;
    const containerId = `yt-${mountId}`;

    void loadYouTubeAPI().then(() => {
      if (cancelled || !window.YT?.Player) return;

      playerRef.current?.destroy();
      playerRef.current = null;
      clearChromeTimer();
      chromeScheduled.current = false;
      setPlaybackReady(false);

      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        width: 1920,
        height: 1080,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          loop: 1,
          playlist: videoId,
          iv_load_policy: 3,
          cc_load_policy: 0,
          disablekb: 1,
          fs: 0,
          showinfo: 0,
          autohide: 1,
          vq: "hd1080",
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            preferHd(event.target);
            const shouldMute = isTrailerMuted();
            setMuted(shouldMute);
            applyAudio(event.target, shouldMute);
            event.target.playVideo();

            const iframe = event.target.getIframe?.();
            if (iframe) {
              iframe.setAttribute("allow", "autoplay; encrypted-media");
              iframe.style.pointerEvents = "none";
              iframe.tabIndex = -1;
              // Hide native chrome until cover lifts — iframe can paint above siblings.
              iframe.style.opacity = "0";
            }
          },
          onStateChange: (event) => {
            if (cancelled) return;

            if (event.data === YT_PAUSED || event.data === YT_ENDED) {
              hideChromeAgain();
              const iframe = event.target.getIframe?.();
              if (iframe) iframe.style.opacity = "0";
              event.target.playVideo();
              return;
            }

            if (event.data !== YT_PLAYING) return;

            preferHd(event.target);
            applyAudio(event.target, isTrailerMuted());
            schedulePlaybackReady(isCancelled);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearChromeTimer();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [
    hasTrailer,
    videoId,
    mountId,
    applyAudio,
    clearChromeTimer,
    schedulePlaybackReady,
    hideChromeAgain,
  ]);

  const showVideo = hasTrailer && videoId;
  // Banner hold + chrome clear both required before trailer is visible
  const videoReady = Boolean(showVideo && holdDone && playbackReady);

  useEffect(() => {
    if (!playerRef.current) return;
    const iframe = playerRef.current.getIframe?.();
    if (iframe) iframe.style.opacity = videoReady ? "1" : "0";
    if (videoReady) applyAudio(playerRef.current, muted);
  }, [muted, videoReady, applyAudio]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setTrailerMuted(next);
    if (playerRef.current) applyAudio(playerRef.current, next);
  }

  const covering = Boolean(showVideo && !videoReady);
  const showPosterImage =
    coverMode === "poster" || !showVideo ? true : false;

  return (
    <section
      className={`relative isolate overflow-hidden ${minHeightClass} ${className}`}
    >
      <div className="absolute inset-0">
        {showVideo && (
          <div
            className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700 ease-out ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden
          >
            <div
              id={`yt-${mountId}`}
              title={`${title} trailer`}
              className="absolute left-1/2 top-1/2 border-0"
              style={{
                width: "177.78vh",
                height: "56.25vw",
                minWidth: "100%",
                minHeight: "100%",
                transform: `translate(-50%, -50%) scale(${scale})`,
              }}
            />
          </div>
        )}

        {/* Opaque cover above iframe until PLAYING + chrome delay — hides YT center controls */}
        {covering && coverMode === "solid" && (
          <div className="absolute inset-0 z-[5] bg-void" aria-hidden />
        )}

        {showPosterImage && (
          <Image
            src={posterSrc}
            alt=""
            fill
            priority
            quality={100}
            sizes="100vw"
            className={`z-[5] object-cover object-[center_25%] transition-opacity duration-[1100ms] ease-out ${
              showVideo
                ? covering
                  ? "opacity-100"
                  : "opacity-0"
                : posterClassName || "opacity-100"
            }`}
          />
        )}

        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-void via-void/50 to-void/10" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-void/80 via-void/30 to-transparent" />
      </div>

      {showAudioToggle && showVideo && videoReady && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute trailer" : "Mute trailer"}
          className="absolute right-5 top-24 z-20 flex h-8 w-8 items-center justify-center rounded-full text-snow/45 transition hover:bg-white/10 hover:text-snow/80 sm:right-8 sm:top-28"
        >
          {muted ? <SoundOffIcon /> : <SoundOnIcon />}
        </button>
      )}

      <div className="relative z-[3]">{children}</div>
    </section>
  );
}

function SoundOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 6.5h2.5L9 3.5v9L5.5 9.5H3V6.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M11.5 6l3 3M14.5 6l-3 3" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function SoundOnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 6.5h2.5L9 3.5v9L5.5 9.5H3V6.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 5.5a3.5 3.5 0 0 1 0 5M13 4a5.5 5.5 0 0 1 0 8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
