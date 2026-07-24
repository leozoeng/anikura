"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  deleteUserAccount,
  endUserSessions,
} from "@/app/admin/user-actions";
import { useAdminFeedback } from "@/components/admin/admin-feedback";
import type { GlobePerson } from "@/components/admin/live-globe";
import {
  formatDurationShort,
  formatLastSeenRelative,
  formatSessionDuration,
  watchingFromPath,
} from "@/lib/admin-presence";
import {
  normalizePresenceDevice,
  PRESENCE_DEVICE_LABEL,
} from "@/lib/presence-device";
import { adminDisplayName, adminIdentityDetail } from "@/lib/profile";

type VisitorDrawerProps = {
  person: GlobePerson | null;
  open: boolean;
  onClose: () => void;
};

export function VisitorDrawer({ person, open, onClose }: VisitorDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useAdminFeedback();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmDelete) setConfirmDelete(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, confirmDelete]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open, person?.id]);

  useEffect(() => {
    setConfirmDelete(false);
  }, [person?.id, open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, [open]);

  const place = person
    ? [person.city, person.country].filter(Boolean).join(", ") || "Unknown place"
    : "";

  const name = person
    ? adminDisplayName(
        {
          nickname: person.nickname,
          username: person.username,
          email: person.email,
          user_id: person.user_id,
        },
        "Anonymous",
      )
    : "—";

  const detail = person
    ? adminIdentityDetail({
        username: person.username,
        email: person.email,
        user_id: person.user_id,
      })
    : null;

  const watching = useMemo(() => {
    if (!person) return null;
    if (person.path_label) {
      return {
        label: person.path_label,
        meta:
          person.path_meta ||
          (person.path?.startsWith("/watch/") ? "Watching" : "Path"),
        path: person.path || "/",
        isWatching:
          person.path_meta === "Watching" ||
          Boolean(person.path?.startsWith("/watch/")),
      };
    }
    return watchingFromPath(person.path);
  }, [person]);

  const session = person
    ? formatSessionDuration(person.first_seen, person.last_seen, nowMs)
    : null;

  function runEndSessions() {
    if (!person) return;
    startTransition(async () => {
      try {
        const result = await endUserSessions({
          userId: person.user_id,
          sessionId: person.session_id,
        });
        toast(
          result.revokedAuth
            ? "Signed them out and cleared live presence"
            : "Cleared live presence for this browser",
          "ok",
        );
        onClose();
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Couldn’t end session", "err");
      }
    });
  }

  function runDeleteAccount() {
    if (!person?.user_id) return;
    startTransition(async () => {
      try {
        await deleteUserAccount(person.user_id!);
        toast("Account deleted", "ok");
        setConfirmDelete(false);
        onClose();
        router.refresh();
      } catch (err) {
        toast(
          err instanceof Error ? err.message : "Couldn’t delete account",
          "err",
        );
      }
    });
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[70] bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Visitor details"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col border-l border-white/[0.1] bg-[#08080a]/98 shadow-[-24px_0_60px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-transform duration-300 ease-[var(--ease-out-soft)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-mute">
              Visitor
            </p>
            <p className="mt-0.5 truncate text-lg tracking-[-0.03em] text-snow">
              {name}
            </p>
            {detail ? (
              <p className="mt-0.5 truncate text-xs text-cloud">{detail}</p>
            ) : person?.user_id ? null : (
              <p className="mt-0.5 text-xs text-mute">Guest session</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs text-mute transition hover:border-white/25 hover:text-snow"
          >
            Close
          </button>
        </div>

        {person ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <p className="text-sm text-cloud">{place}</p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-3">
                  <dt className="text-mute">
                    {watching?.isWatching ? "Watching" : "On"}
                  </dt>
                  <dd className="max-w-[14rem] text-right">
                    <span className="block truncate text-snow">
                      {watching?.label || "—"}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[0.65rem] text-mute">
                      {watching?.path || person.path || "/"}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-3">
                  <dt className="text-mute">Session</dt>
                  <dd className="text-right">
                    <span className="block tabular-nums text-snow">
                      {session?.label ?? "—"}
                    </span>
                    <span className="mt-0.5 block text-[0.65rem] text-mute">
                      {person.first_seen
                        ? `since ${new Date(person.first_seen).toLocaleTimeString()}`
                        : "start time unavailable"}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-3">
                  <dt className="text-mute">Last seen</dt>
                  <dd className="text-right text-xs text-cloud">
                    <span className="block">
                      {formatLastSeenRelative(person.last_seen, nowMs)}
                    </span>
                    <span className="mt-0.5 block text-mute">
                      {new Date(person.last_seen).toLocaleString()}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-3">
                  <dt className="text-mute">Signed in</dt>
                  <dd className="text-right text-cloud">
                    {person.user_id ? "Yes" : "Guest"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-3">
                  <dt className="text-mute">Device</dt>
                  <dd className="text-right text-cloud">
                    {(() => {
                      const device = normalizePresenceDevice(person.device);
                      return device ? PRESENCE_DEVICE_LABEL[device] : "—";
                    })()}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-3">
                  <dt className="text-mute">Username</dt>
                  <dd className="max-w-[14rem] truncate text-right text-cloud">
                    {person.username ? `@${person.username}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-3">
                  <dt className="text-mute">Account</dt>
                  <dd className="max-w-[14rem] truncate text-right text-cloud">
                    {person.email || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-3">
                  <dt className="text-mute">Session id</dt>
                  <dd className="font-mono text-xs text-cloud">
                    {(person.session_id || "—").slice(0, 12)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">Coords</dt>
                  <dd className="font-mono text-xs tabular-nums text-cloud">
                    {person.lat != null && person.lng != null
                      ? `${person.lat.toFixed(2)}, ${person.lng.toFixed(2)}`
                      : "—"}
                  </dd>
                </div>
                {session?.seconds != null && session.seconds > 0 ? (
                  <div className="rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2 text-[0.7rem] text-mute">
                    Present for{" "}
                    <span className="tabular-nums text-cloud">
                      {formatDurationShort(session.seconds)}
                    </span>{" "}
                    this browser session (from first heartbeat).
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="border-t border-white/[0.06] px-5 py-4">
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-mute">
                Moderation
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={pending || (!person.session_id && !person.user_id)}
                  onClick={runEndSessions}
                  className="rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-left text-sm text-snow transition hover:border-white/25 hover:bg-white/[0.08] disabled:opacity-50"
                >
                  <span className="block font-medium">
                    {person.user_id ? "End sessions" : "Clear live presence"}
                  </span>
                  <span className="mt-0.5 block text-[0.7rem] text-mute">
                    {person.user_id
                      ? "Revoke auth tokens and drop them from Live"
                      : "Remove this guest from the live desk"}
                  </span>
                </button>

                {person.user_id ? (
                  confirmDelete ? (
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3">
                      <p className="text-sm text-red-100">
                        Delete{" "}
                        <span className="font-medium text-snow">{name}</span>{" "}
                        permanently? Profile and auth are removed. This cannot
                        be undone.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={runDeleteAccount}
                          className="rounded-full bg-red-500/90 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                        >
                          {pending ? "Deleting…" : "Delete account"}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setConfirmDelete(false)}
                          className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-cloud transition hover:border-white/25 hover:text-snow"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setConfirmDelete(true)}
                      className="rounded-xl border border-red-400/25 bg-red-500/[0.06] px-3.5 py-2.5 text-left text-sm text-red-100 transition hover:border-red-400/40 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <span className="block font-medium">Delete account</span>
                      <span className="mt-0.5 block text-[0.7rem] text-red-200/70">
                        Remove auth user and profile forever
                      </span>
                    </button>
                  )
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-mute">
            Select a live visitor to inspect.
          </div>
        )}
      </aside>
    </>
  );
}
