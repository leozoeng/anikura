"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type HeaderAuthProps = {
  initialEmail?: string | null;
  isAdmin?: boolean;
  initialAvatarUrl?: string | null;
  initialNickname?: string | null;
};

export function HeaderAuth({
  initialEmail = null,
  isAdmin = false,
  initialAvatarUrl = null,
  initialNickname = null,
}: HeaderAuthProps) {
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [nickname, setNickname] = useState<string | null>(initialNickname);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
    setAvatarUrl(initialAvatarUrl);
    setNickname(initialNickname);
  }, [initialEmail, initialAvatarUrl, initialNickname]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextEmail = session?.user?.email ?? null;
      setEmail(nextEmail);
      if (!session?.user) {
        setAvatarUrl(null);
        setNickname(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, nickname")
        .eq("id", session.user.id)
        .maybeSingle();
      setAvatarUrl(data?.avatar_url ?? null);
      setNickname(data?.nickname ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail(null);
    setAvatarUrl(null);
    setNickname(null);
    setMenuOpen(false);
    window.location.assign("/");
  }

  const authReady = isSupabaseConfigured();

  if (!email) {
    return (
      <>
        <div className="hidden items-center gap-1 md:flex">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setModalOpen(true);
            }}
            className="rounded-full px-3.5 py-1.5 text-[0.8125rem] tracking-[-0.01em] text-mute transition duration-300 hover:bg-white/[0.05] hover:text-snow"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setModalOpen(true);
            }}
            className="rounded-full bg-white/[0.08] px-3.5 py-1.5 text-[0.8125rem] tracking-[-0.01em] text-snow shadow-[inset_0_0_0_1px_rgba(255,140,170,0.22)] transition duration-300 hover:bg-white/[0.12] hover:shadow-[inset_0_0_0_1px_rgba(255,140,170,0.35)]"
          >
            Create account
          </button>
        </div>
        <AuthModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initialMode={mode}
          configured={authReady}
        />
      </>
    );
  }

  const label =
    nickname?.trim() || email.split("@")[0] || "Account";
  const initial = label.slice(0, 1).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={`Account menu for ${label}`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="group flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-1 transition duration-300 hover:bg-white/[0.06] sm:pr-2.5"
      >
        <span className="relative h-9 w-9 overflow-hidden rounded-full bg-gradient-to-b from-[#2a2a30] to-[#141416] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-white/20 transition duration-300 group-hover:ring-[#ffb3c7]/45">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="36px"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-[0.8rem] font-semibold tracking-[-0.02em] text-sakura-soft">
              {initial}
            </span>
          )}
        </span>
        <span className="hidden max-w-[7.5rem] truncate text-[0.8125rem] font-medium tracking-[-0.02em] text-cloud transition group-hover:text-snow sm:inline">
          {label}
        </span>
        <span
          aria-hidden
          className="hidden text-[0.65rem] text-mute transition group-hover:text-cloud sm:inline"
        >
          ▾
        </span>
      </button>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close account menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+10px)] z-50 min-w-[13.5rem] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0c0c0e]/95 py-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl"
          >
            <div className="border-b border-white/[0.06] px-3.5 pb-2.5 pt-2">
              <p className="truncate text-[0.8125rem] font-medium tracking-[-0.02em] text-snow">
                {label}
              </p>
              <p className="mt-0.5 truncate text-[0.7rem] text-mute">{email}</p>
            </div>
            <Link
              href="/profile"
              role="menuitem"
              className="mt-1 block px-3.5 py-2.5 text-sm tracking-[-0.01em] text-cloud transition hover:bg-white/[0.06] hover:text-snow"
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                role="menuitem"
                className="block px-3.5 py-2.5 text-sm tracking-[-0.01em] text-cloud transition hover:bg-white/[0.06] hover:text-snow"
                onClick={() => setMenuOpen(false)}
              >
                Admin
              </Link>
            ) : null}
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="block w-full px-3.5 py-2.5 text-left text-sm tracking-[-0.01em] text-cloud transition hover:bg-white/[0.06] hover:text-snow"
            >
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
