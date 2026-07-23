"use client";

import { useEffect, useState } from "react";
import type { GlobePerson } from "@/components/admin/live-globe";
import {
  formatLastSeenRelative,
  formatSessionDuration,
  watchingFromPath,
} from "@/lib/admin-presence";
import { adminDisplayName, adminIdentityDetail } from "@/lib/profile";

export type LivePresencePerson = GlobePerson & {
  first_seen?: string | null;
  path_label?: string | null;
  path_meta?: string | null;
};

type LivePresenceTableProps = {
  people: LivePresencePerson[];
  liveCount: number;
  selectedId: string | null;
  drawerOpen: boolean;
  onSelect: (person: LivePresencePerson) => void;
};

function visitorLabel(p: LivePresencePerson) {
  return adminDisplayName(
    {
      nickname: p.nickname,
      username: p.username,
      email: p.email,
      user_id: p.user_id,
    },
    "Guest",
  );
}

function visitorDetail(p: LivePresencePerson) {
  return adminIdentityDetail({
    username: p.username,
    email: p.email,
    user_id: p.user_id,
  });
}

function resolveWatching(p: LivePresencePerson) {
  if (p.path_label) {
    return {
      label: p.path_label,
      meta: p.path_meta || (p.path?.startsWith("/watch/") ? "Watching" : "Path"),
      path: p.path || "/",
      isWatching: (p.path_meta || "") === "Watching" || Boolean(p.path?.startsWith("/watch/")),
    };
  }
  return watchingFromPath(p.path);
}

export function LivePresenceTable({
  people,
  liveCount,
  selectedId,
  drawerOpen,
  onSelect,
}: LivePresenceTableProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      aria-label="Live presence"
      className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 transition duration-300 hover:border-white/[0.12] sm:p-4"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full bg-snow ${
                liveCount > 0 ? "admin-live-pulse" : "opacity-40"
              }`}
            />
            <h2 className="text-[0.95rem] tracking-[-0.02em] text-snow">
              Live now
            </h2>
            <span className="tabular-nums text-sm text-cloud">
              {liveCount}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-mute">
            Who&apos;s here · session time · what they&apos;re on
          </p>
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="text-[0.62rem] uppercase tracking-[0.12em] text-mute">
            <tr className="border-b border-white/[0.06]">
              <th className="pb-2 pr-3 font-medium">Visitor</th>
              <th className="pb-2 pr-3 font-medium">Auth</th>
              <th className="pb-2 pr-3 font-medium">Session</th>
              <th className="pb-2 pr-3 font-medium">Watching / path</th>
              <th className="pb-2 pr-3 font-medium">Place</th>
              <th className="pb-2 font-medium">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {people.slice(0, 64).map((p) => {
              const active = p.id === selectedId && drawerOpen;
              const detail = visitorDetail(p);
              const session = formatSessionDuration(
                p.first_seen,
                p.last_seen,
                nowMs,
              );
              const watching = resolveWatching(p);
              return (
                <tr
                  key={p.id}
                  className={`cursor-pointer border-b border-white/[0.04] transition duration-200 ${
                    active
                      ? "bg-white/[0.07] text-snow"
                      : "text-cloud hover:bg-white/[0.03] hover:text-snow"
                  }`}
                  onClick={() => onSelect(p)}
                >
                  <td className="py-2.5 pr-3">
                    <span className="block text-sm text-snow">
                      {visitorLabel(p)}
                    </span>
                    <span className="block text-[0.65rem] text-mute">
                      {detail || (p.user_id ? "Signed in" : "Anonymous")}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-wider ${
                        p.user_id
                          ? "border-white/15 text-cloud"
                          : "border-white/[0.08] text-mute"
                      }`}
                    >
                      {p.user_id ? "Signed in" : "Guest"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="block tabular-nums text-sm text-snow">
                      {session.label}
                    </span>
                    <span className="block text-[0.6rem] text-mute">
                      {session.source === "session"
                        ? "this session"
                        : "no start time"}
                    </span>
                  </td>
                  <td className="max-w-[16rem] py-2.5 pr-3">
                    <span className="block truncate text-sm text-snow">
                      {watching.label}
                    </span>
                    <span className="block truncate font-mono text-[0.6rem] text-mute">
                      {watching.isWatching ? watching.meta : watching.path}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-xs">
                    {[p.city, p.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="py-2.5 text-xs tabular-nums text-mute">
                    {formatLastSeenRelative(p.last_seen, nowMs)}
                  </td>
                </tr>
              );
            })}
            {people.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-mute">
                  No live presence yet — open the site in another tab.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <ul className="space-y-1 md:hidden">
        {people.slice(0, 64).map((p) => {
          const active = p.id === selectedId && drawerOpen;
          const detail = visitorDetail(p);
          const session = formatSessionDuration(
            p.first_seen,
            p.last_seen,
            nowMs,
          );
          const watching = resolveWatching(p);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p)}
                className={`flex w-full flex-col gap-1 rounded-lg px-2.5 py-2.5 text-left transition ${
                  active
                    ? "bg-white/[0.08] text-snow"
                    : "text-cloud hover:bg-white/[0.04] hover:text-snow"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm text-snow">
                    {visitorLabel(p)}
                  </span>
                  <span className="shrink-0 tabular-nums text-xs text-cloud">
                    {session.label}
                  </span>
                </span>
                <span className="truncate text-[0.65rem] text-mute">
                  {detail || (p.user_id ? "Signed in" : "Guest")}
                  {" · "}
                  {p.user_id ? "Signed in" : "Guest"}
                </span>
                <span className="truncate text-xs text-cloud">
                  {watching.label}
                </span>
                <span className="flex justify-between gap-2 text-[0.65rem] text-mute">
                  <span className="truncate">
                    {[p.city, p.country].filter(Boolean).join(", ") || "—"}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatLastSeenRelative(p.last_seen, nowMs)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {people.length === 0 ? (
          <li className="rounded-lg border border-dashed border-white/[0.08] px-3 py-5 text-center text-sm text-mute">
            No live presence yet.
          </li>
        ) : null}
      </ul>
    </section>
  );
}
