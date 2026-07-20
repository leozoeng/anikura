"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type HeaderAuthProps = {
  initialEmail?: string | null;
  isAdmin?: boolean;
};

export function HeaderAuth({
  initialEmail = null,
  isAdmin = false,
}: HeaderAuthProps) {
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail(null);
    setMenuOpen(false);
    window.location.assign("/");
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!email) {
    return (
      <>
        <div className="hidden items-center gap-1.5 sm:flex">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setModalOpen(true);
            }}
            className="rounded-full px-3.5 py-1.5 text-[0.8125rem] text-cloud transition hover:bg-white/[0.06] hover:text-snow"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setModalOpen(true);
            }}
            className="rounded-full bg-snow px-3.5 py-1.5 text-[0.8125rem] font-medium text-void transition hover:bg-white"
          >
            Create account
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setModalOpen(true);
          }}
          className="rounded-full bg-snow px-3 py-1.5 text-[0.75rem] font-medium text-void transition hover:bg-white sm:hidden"
        >
          Sign in
        </button>
        <AuthModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initialMode={mode}
        />
      </>
    );
  }

  const label = email.split("@")[0] ?? "Account";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex max-w-[9.5rem] items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[0.8125rem] text-snow transition hover:bg-white/[0.08]"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sakura" aria-hidden />
        <span className="truncate">{label}</span>
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
