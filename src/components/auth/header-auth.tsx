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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setModalOpen(true);
            }}
            className="hidden rounded-full px-3.5 py-1.5 text-[0.8125rem] text-cloud transition hover:bg-white/[0.06] hover:text-snow sm:inline-flex"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setModalOpen(true);
            }}
            className="inline-flex rounded-full bg-snow px-3.5 py-1.5 text-[0.75rem] font-medium text-void transition hover:bg-white sm:text-[0.8125rem]"
          >
            <span className="sm:hidden">Sign in</span>
            <span className="hidden sm:inline">Create account</span>
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
        className="relative h-9 w-9 overflow-hidden rounded-full bg-raised ring-1 ring-white/15 transition hover:ring-white/35"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            fill
            className="object-cover"
            sizes="36px"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-[0.8rem] font-medium text-sakura-soft">
            {initial}
          </span>
        )}
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
            className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[11rem] overflow-hidden rounded-xl border border-white/[0.1] bg-[#0c0c0e] py-1 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
          >
            <p className="truncate px-3 py-2 text-[0.7rem] text-mute">{email}</p>
            <Link
              href="/profile"
              role="menuitem"
              className="block px-3 py-2 text-sm text-snow transition hover:bg-white/[0.06]"
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                role="menuitem"
                className="block px-3 py-2 text-sm text-snow transition hover:bg-white/[0.06]"
                onClick={() => setMenuOpen(false)}
              >
                Admin
              </Link>
            ) : null}
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="block w-full px-3 py-2 text-left text-sm text-cloud transition hover:bg-white/[0.06] hover:text-snow"
            >
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
