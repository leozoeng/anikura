"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function AuthMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "loading") {
    return (
      <div
        className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/[0.06]"
        aria-hidden
      />
    );
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() =>
          void signIn("discord", {
            callbackUrl: "https://discord.gg/cm72gXTASn",
          })
        }
        className="group inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-white/[0.06] px-3 text-[0.75rem] tracking-[-0.01em] text-cloud shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition duration-300 hover:bg-[#5865F2]/18 hover:text-snow hover:shadow-[inset_0_0_0_1px_rgba(88,101,242,0.45)]"
      >
        <DiscordMark className="opacity-80 transition group-hover:opacity-100" />
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  const displayName =
    session.user.name?.trim() ||
    session.user.discordUsername ||
    "Member";
  const avatar = session.user.image;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 max-w-[11rem] items-center gap-2 rounded-full bg-white/[0.05] py-1 pl-1 pr-2.5 text-left shadow-[inset_0_0_0_1px_rgba(255,140,170,0.18)] transition duration-300 hover:bg-[#ff8caa]/10"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#ff8caa]/20 text-[0.7rem] text-[#ffb3c7]">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="hidden truncate text-[0.75rem] tracking-[-0.01em] text-snow sm:inline">
          {displayName}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[11rem] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c10]/95 py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-xl"
        >
          <div className="border-b border-white/[0.06] px-3.5 py-2.5">
            <p className="truncate text-[0.8125rem] text-snow">{displayName}</p>
            {session.user.discordUsername ? (
              <p className="truncate text-[0.7rem] text-mute">
                @{session.user.discordUsername}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut({ callbackUrl: "/" });
            }}
            className="flex w-full px-3.5 py-2.5 text-left text-[0.8125rem] text-cloud transition hover:bg-white/[0.05] hover:text-snow"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DiscordMark({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
