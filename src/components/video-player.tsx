"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { EmbedServer } from "@/lib/embeds";

type HealthMap = Record<string, "ok" | "down" | "checking" | "unknown">;

type Props = {
  title: string;
  servers: EmbedServer[];
  preferredServerId?: string | null;
  watchBasePath: string;
  language: "sub" | "dub";
  episode: number;
};

export function VideoPlayer({
  title,
  servers,
  preferredServerId = null,
  watchBasePath,
  language,
  episode,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [serverId, setServerId] = useState<string | null>(
    preferredServerId || servers[0]?.id || null,
  );
  const [health, setHealth] = useState<HealthMap>({});
  const [resolving, setResolving] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const resolveGen = useRef(0);
  const streamKey = `${episode}:${language}:${servers.map((s) => `${s.id}:${s.url}`).join("|")}`;

  const active = useMemo(
    () => servers.find((s) => s.id === serverId) || null,
    [servers, serverId],
  );

  const syncUrl = useCallback(
    (id: string) => {
      const url = `${watchBasePath}?ep=${episode}&lang=${language}&server=${id}`;
      startTransition(() => {
        router.replace(url, { scroll: false });
      });
    },
    [watchBasePath, episode, language, router],
  );

  const applyServer = useCallback(
    (id: string) => {
      setServerId(id);
      setReloadKey((k) => k + 1);
      syncUrl(id);
    },
    [syncUrl],
  );

  const resolveServers = useCallback(
    async (opts?: { preferredId?: string | null; forcePreferred?: boolean }) => {
      if (!servers.length) {
        setResolving(false);
        setResolveError("No embed servers available");
        return;
      }

      const gen = ++resolveGen.current;
      setResolving(true);
      setResolveError(null);
      setHealth(Object.fromEntries(servers.map((s) => [s.id, "checking" as const])));

      const preferredId = opts?.preferredId ?? null;

      try {
        const res = await fetch("/api/embed-resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            servers: servers.map((s) => ({ id: s.id, url: s.url })),
            preferredId,
          }),
        });

        if (!res.ok) throw new Error("resolve_failed");
        const data = (await res.json()) as {
          best: { id: string } | null;
          results: { id: string; ok: boolean }[];
        };

        if (gen !== resolveGen.current) return;

        const nextHealth: HealthMap = {};
        for (const result of data.results) {
          nextHealth[result.id] = result.ok ? "ok" : "down";
        }
        for (const server of servers) {
          if (!nextHealth[server.id]) nextHealth[server.id] = "unknown";
        }
        setHealth(nextHealth);

        if (opts?.forcePreferred && preferredId && nextHealth[preferredId] === "ok") {
          applyServer(preferredId);
          setResolving(false);
          return;
        }

        if (data.best) {
          applyServer(data.best.id);
          setResolving(false);
          return;
        }

        const fallback =
          (preferredId && servers.find((s) => s.id === preferredId)) ||
          servers[0];
        if (fallback) {
          applyServer(fallback.id);
          setResolveError("Using best available server");
        } else {
          setResolveError("All servers appear unavailable");
        }
        setResolving(false);
      } catch {
        if (gen !== resolveGen.current) return;
        setHealth(
          Object.fromEntries(servers.map((s) => [s.id, "unknown" as const])),
        );
        const fallback =
          servers.find((s) => s.id === preferredId) || servers[0];
        if (fallback) applyServer(fallback.id);
        setResolveError("Could not verify servers");
        setResolving(false);
      }
    },
    [servers, applyServer],
  );

  useEffect(() => {
    void resolveServers({
      preferredId: preferredServerId,
      forcePreferred: Boolean(preferredServerId),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamKey]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (!menuOpen) return;
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  function selectManual(id: string) {
    applyServer(id);
    setMenuOpen(false);
  }

  function tryNextServer() {
    if (!servers.length || !serverId) return;
    const idx = servers.findIndex((s) => s.id === serverId);
    const rotated = [...servers.slice(idx + 1), ...servers.slice(0, idx)];
    const next =
      rotated.find((s) => health[s.id] === "ok") ||
      rotated.find((s) => health[s.id] !== "down") ||
      rotated[0];
    if (next) selectManual(next.id);
  }

  function healthDot(id: string) {
    const state = health[id] || "unknown";
    const color =
      state === "ok"
        ? "bg-emerald-400"
        : state === "down"
          ? "bg-red-400"
          : state === "checking"
            ? "bg-amber-300 animate-pulse"
            : "bg-white/30";
    return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
  }

  if (!servers.length) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-elevated text-mute">
        No embed servers available
      </div>
    );
  }

  return (
    <div className="group/player relative">
      <div className="overflow-hidden rounded-2xl bg-black shadow-[0_50px_120px_rgba(0,0,0,0.65)] ring-1 ring-white/10">
        <div className="relative aspect-video w-full bg-black">
          {resolving && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/92">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-white" />
              <p className="text-sm text-cloud">Connecting…</p>
            </div>
          )}

          {!resolving && active && (
            <iframe
              key={`${active.id}-${reloadKey}-${episode}-${language}`}
              src={active.url}
              title={title}
              className="absolute inset-0 h-full w-full"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              referrerPolicy="origin"
            />
          )}

          {!resolving && !active && (
            <div className="absolute inset-0 flex items-center justify-center text-mute">
              No playable server found
            </div>
          )}
        </div>
      </div>

      {/* Compact playback bar */}
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-elevated/50 px-3 py-2 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-2 text-xs text-mute">
          {active && healthDot(active.id)}
          <span className="truncate">
            {active?.label ?? "Server"}
            {resolving ? " · connecting" : ""}
          </span>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Playback settings"
            className="grid h-8 w-8 place-items-center rounded-full text-cloud transition hover:bg-white/10 hover:text-snow"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.25" />
              <circle cx="8" cy="8" r="1.25" />
              <circle cx="8" cy="13" r="1.25" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-black/95 py-2 shadow-2xl backdrop-blur-xl">
              <p className="px-3.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">
                Server
              </p>
              {servers.map((server) => {
                const selected = server.id === active?.id;
                const state = health[server.id] || "unknown";
                return (
                  <button
                    key={server.id}
                    type="button"
                    onClick={() => selectManual(server.id)}
                    className={`flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition hover:bg-white/5 ${
                      selected ? "text-snow" : "text-cloud"
                    }`}
                  >
                    {healthDot(server.id)}
                    <span className="flex-1">{server.label}</span>
                    <span className="text-[10px] uppercase text-mute">
                      {state === "ok" ? "ok" : state === "down" ? "down" : ""}
                    </span>
                  </button>
                );
              })}
              <div className="my-2 border-t border-white/8" />
              <button
                type="button"
                onClick={() => {
                  void resolveServers({ preferredId: null });
                  setMenuOpen(false);
                }}
                className="block w-full px-3.5 py-2 text-left text-sm text-cloud hover:bg-white/5 hover:text-snow"
              >
                Auto-select best
              </button>
              <button
                type="button"
                onClick={() => {
                  tryNextServer();
                  setMenuOpen(false);
                }}
                className="block w-full px-3.5 py-2 text-left text-sm text-cloud hover:bg-white/5 hover:text-snow"
              >
                Try next server
              </button>
              <button
                type="button"
                onClick={() => {
                  setReloadKey((k) => k + 1);
                  setMenuOpen(false);
                }}
                className="block w-full px-3.5 py-2 text-left text-sm text-cloud hover:bg-white/5 hover:text-snow"
              >
                Reload player
              </button>
            </div>
          )}
        </div>
      </div>

      {resolveError && (
        <p className="mt-2 text-center text-xs text-mute">{resolveError}</p>
      )}
    </div>
  );
}
