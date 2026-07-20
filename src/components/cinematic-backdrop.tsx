"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
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
      onError?: (event: { data: number }) => void;
    };
  },
) => YTPlayer;

declare global {
  interface Window {
    YT?: { Player: YTPlayerConstructor; loaded?: number };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;

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

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      done();
    };

    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    } else if (window.YT?.Player) {
      // Script already finished while we were wiring the callback.
      done();
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
  /** Fallback still only — never shown when a trailer is playing. */
  posterSrc: string;
  title: string;
  children?: ReactNode;
  className?: string;
  minHeightClass?: string;
  posterClassName?: string;
  scale?: number;
  showAudioToggle?: boolean;
  /** @deprecated Trailer-only; ignored. Kept so call sites don’t break. */
  coverMode?: "poster" | "solid";
  /** @deprecated No banner hold; trailer starts immediately. */
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
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [hasTrailer, setHasTrailer] = useState(Boolean(videoId));
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failed, setFailed] = useState(false);

  const applyAudio = useCallback((player: YTPlayer, shouldMute: boolean) => {
    if (shouldMute) {
      player.mute();
    } else {
      player.unMute();
      player.setVolume(TRAILER_VOLUME);
    }
  }, []);

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

  useEffect(() => {
    setHasTrailer(Boolean(videoId) && !reducedMotion);
    setPlaying(false);
    setFailed(false);
  }, [videoId, reducedMotion]);

  useEffect(() => {
    if (!hasTrailer || !videoId || failed) return;

    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    // Mount into a fresh child so React never reconciles over YouTube's iframe.
    host.replaceChildren();
    const mount = document.createElement("div");
    mount.style.width = "100%";
    mount.style.height = "100%";
    host.appendChild(mount);

    void loadYouTubeAPI().then(() => {
      if (cancelled || !window.YT?.Player) return;

      playerRef.current?.destroy();
      playerRef.current = null;
      setPlaying(false);

      playerRef.current = new window.YT.Player(mount, {
        videoId,
        width: "100%",
        height: "100%",
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
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            preferHd(event.target);
            // Autoplay requires mute; soft volume (~20%) only after unmute.
            event.target.mute();
            setMuted(true);
            if (!isTrailerMuted()) {
              // User previously unmuted — restore after playback starts.
              window.setTimeout(() => {
                if (cancelled) return;
                applyAudio(event.target, false);
                setMuted(false);
              }, 250);
            }
            event.target.playVideo();

            const iframe = event.target.getIframe?.();
            if (iframe) {
              iframe.setAttribute(
                "allow",
                "autoplay; encrypted-media; picture-in-picture",
              );
              iframe.setAttribute("title", `${title} trailer`);
              iframe.style.pointerEvents = "none";
              iframe.style.width = "100%";
              iframe.style.height = "100%";
              iframe.tabIndex = -1;
            }
          },
          onStateChange: (event) => {
            if (cancelled) return;

            if (event.data === YT_PAUSED || event.data === YT_ENDED) {
              setPlaying(false);
              event.target.playVideo();
              return;
            }

            if (event.data !== YT_PLAYING) return;

            preferHd(event.target);
            applyAudio(event.target, isTrailerMuted());
            setPlaying(true);
          },
          onError: () => {
            if (cancelled) return;
            setFailed(true);
            setPlaying(false);
            setHasTrailer(false);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      host.replaceChildren();
    };
  }, [hasTrailer, videoId, failed, applyAudio, title]);

  useEffect(() => {
    if (!playerRef.current || !playing) return;
    applyAudio(playerRef.current, muted);
  }, [muted, playing, applyAudio]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setTrailerMuted(next);
    if (playerRef.current) applyAudio(playerRef.current, next);
  }

  const showVideo = hasTrailer && Boolean(videoId) && !failed;

  return (
    <section
      className={`relative isolate overflow-hidden ${minHeightClass} ${className}`}
    >
      <div className="absolute inset-0 bg-void">
        <Image
          src={posterSrc}
          alt=""
          fill
          priority
          quality={100}
          sizes="100vw"
          className={`object-cover object-[center_25%] transition-opacity duration-700 ${
            showVideo && playing
              ? "opacity-0"
              : posterClassName || "opacity-100"
          }`}
        />

        {showVideo && (
          <div
            className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700 ${
              playing ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden
          >
            <div
              ref={hostRef}
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

        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-void via-void/50 to-void/10" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-void/80 via-void/30 to-transparent" />
      </div>

      {showAudioToggle && showVideo && (
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
