"use client";

import { SafeImage } from "@/components/safe-image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PUBLIC_PROFILE_SELECT,
  accentAmbientEnabled,
  displayName,
  formatMemberSince,
  handleFromProfile,
  hexToRgbChannels,
  resolveAccentHex,
  resolveProfileBadges,
  type PublicProfile,
} from "@/lib/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ProfileBadges } from "@/components/profile/profile-badges";

/**
 * Compact Discord-style profile popout for comment name hover.
 */
export function ProfilePeekCard({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) return;
    const supabase = createClient();
    let cancelled = false;
    setProfile(null);
    setFailed(false);
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(PUBLIC_PROFILE_SELECT)
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setFailed(true);
        return;
      }
      setProfile({ ...(data as PublicProfile), email: null });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (failed) {
    return (
      <div className="w-[280px] overflow-hidden rounded-xl border border-white/10 bg-[#111214] px-3.5 py-3 text-sm text-[#949ba4] shadow-[0_16px_40px_rgba(0,0,0,0.55)] animate-in fade-in zoom-in-95 duration-150">
        Profile unavailable
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-[280px] overflow-hidden rounded-xl border border-white/10 bg-[#111214] shadow-[0_16px_40px_rgba(0,0,0,0.55)] animate-in fade-in zoom-in-95 duration-150">
        <div className="h-12 animate-pulse bg-[#1e1f22]" />
        <div className="relative -mt-5 px-3 pb-3 pt-1">
          <div className="mb-2 h-10 w-10 animate-pulse rounded-full bg-[#2b2d31]" />
          <div className="h-3 w-24 animate-pulse rounded bg-white/[0.08]" />
          <div className="mt-1.5 h-2.5 w-16 animate-pulse rounded bg-white/[0.05]" />
        </div>
      </div>
    );
  }

  const name = displayName(profile);
  const handle = handleFromProfile(profile);
  const accent = resolveAccentHex(profile);
  const ambient = accentAmbientEnabled(profile);
  const rgb = hexToRgbChannels(accent);
  const badges = resolveProfileBadges(profile);

  return (
    <div
      className="w-[280px] overflow-hidden rounded-xl border border-white/10 bg-[#111214] shadow-[0_16px_40px_rgba(0,0,0,0.55)] animate-in fade-in zoom-in-95 duration-150"
      style={{
        boxShadow: ambient
          ? `0 16px 40px rgba(0,0,0,0.55), 0 0 28px rgba(${rgb}, 0.14)`
          : undefined,
      }}
    >
      <div className="relative h-12 bg-[#1e1f22]">
        {profile.banner_url ? (
          <SafeImage
            src={profile.banner_url}
            alt=""
            fill
            className="object-cover opacity-90"
            sizes="280px"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, rgba(${rgb}, 0.72), #1a1b1e)`,
            }}
          />
        )}
      </div>
      <div className="relative -mt-5 px-3 pb-3">
        <div
          className="relative mb-2 h-10 w-10 overflow-hidden rounded-full bg-[#1e1f22]"
          style={{
            boxShadow: `0 0 0 3px #111214, 0 0 0 4px ${accent}`,
          }}
        >
          {profile.avatar_url ? (
            <SafeImage
              src={profile.avatar_url}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div
              className="grid h-full w-full place-items-center text-xs font-semibold"
              style={{ color: accent }}
            >
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
          <p className="truncate text-[0.9rem] font-semibold leading-tight text-[#f2f3f5]">
            {name}
          </p>
          <ProfileBadges badges={badges} size="sm" />
        </div>
        <p className="truncate text-[0.7rem] text-[#949ba4]">{handle}</p>
        {profile.bio ? (
          <p className="mt-1.5 line-clamp-2 text-[0.72rem] leading-snug text-[#b5bac1]">
            {profile.bio}
          </p>
        ) : null}
        <p className="mt-2 text-[0.62rem] uppercase tracking-[0.1em] text-[#6d6f78]">
          Member since · {formatMemberSince(profile.created_at)}
        </p>
      </div>
    </div>
  );
}
