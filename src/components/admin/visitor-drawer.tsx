"use client";

import { useEffect, useRef } from "react";
import type { GlobePerson } from "@/components/admin/live-globe";
import { adminDisplayName, adminIdentityDetail } from "@/lib/profile";

type VisitorDrawerProps = {
  person: GlobePerson | null;
  open: boolean;
  onClose: () => void;
};

export function VisitorDrawer({ person, open, onClose }: VisitorDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open, person?.id]);

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
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <p className="text-sm text-cloud">{place}</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-3">
                <dt className="text-mute">Path</dt>
                <dd className="max-w-[14rem] truncate text-right font-mono text-xs text-snow">
                  {person.path || "/"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-3">
                <dt className="text-mute">Signed in</dt>
                <dd className="text-right text-cloud">
                  {person.user_id ? "Yes" : "Anonymous"}
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
                <dt className="text-mute">Session</dt>
                <dd className="font-mono text-xs text-cloud">
                  {(person.session_id || "—").slice(0, 12)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/[0.05] pb-3">
                <dt className="text-mute">Last seen</dt>
                <dd className="text-right text-xs text-cloud">
                  {new Date(person.last_seen).toLocaleString()}
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
            </dl>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-mute">
            Select a globe dot or live path to inspect a visitor.
          </div>
        )}
      </aside>
    </>
  );
}
