"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { CommunityPartnersMarquee } from "@/components/social/community-partners-marquee";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const LOGIN_HREF = "/login?next=/profile";
const SIGNUP_HREF = "/login?mode=signup&next=/profile";

export function GuestSocialPreview() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const authReady = isSupabaseConfigured();

  function openAuth(next: "signin" | "signup") {
    setMode(next);
    setModalOpen(true);
  }

  return (
    <div className="page-shell relative pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-14 sm:pb-24 sm:pt-16 md:pt-20">
      <section
        aria-label="Social preview"
        className="relative isolate overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080809]"
      >
        {/* Static layout snapshot — blurred & non-interactive */}
        <div
          aria-hidden
          className="pointer-events-none relative select-none"
        >
          <div className="relative min-h-[min(68svh,34rem)] w-full sm:min-h-[min(70svh,40rem)] lg:min-h-[min(72svh,44rem)]">
            <Image
              src="/social/guest-preview.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="scale-[1.06] object-cover object-[center_18%] blur-[11px] brightness-[0.52] contrast-[1.05] sm:object-top sm:blur-[14px]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75" />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1.5px]" />
        </div>

        {/* Centered sign-in prompt */}
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-[22rem] rounded-2xl border border-white/[0.12] bg-[#0c0c0e]/78 px-5 py-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:max-w-md sm:px-8 sm:py-9">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-mute">
              Social
            </p>
            <h1 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.03em] text-snow sm:text-[1.55rem]">
              Your boards await
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-cloud sm:text-[0.9375rem]">
              Profiles, shelves, and people — sign in to open your Social hub.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => openAuth("signin")}
                className="pressable rounded-full bg-white px-5 py-2.5 text-[0.8125rem] font-semibold tracking-[-0.01em] text-[#0a0a0c] transition hover:bg-white/90"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => openAuth("signup")}
                className="pressable rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-[0.8125rem] font-medium tracking-[-0.01em] text-snow transition hover:bg-white/[0.1]"
              >
                Sign up
              </button>
            </div>
            <p className="mt-4 text-[0.72rem] text-mute">
              <Link
                href={LOGIN_HREF}
                className="text-cloud underline decoration-white/20 underline-offset-2 transition hover:text-snow"
              >
                Full sign-in page
              </Link>
              <span aria-hidden className="mx-1.5 text-white/25">
                ·
              </span>
              <Link
                href={SIGNUP_HREF}
                className="text-cloud underline decoration-white/20 underline-offset-2 transition hover:text-snow"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-4 sm:mt-5">
        <CommunityPartnersMarquee />
      </div>

      <AuthModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode={mode}
        configured={authReady}
      />
    </div>
  );
}
