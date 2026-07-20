"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PROFILE_SELECT,
  accentAmbientEnabled,
  displayName,
  formatMemberSince,
  handleFromProfile,
  hexToRgbChannels,
  resolveAccentHex,
  type PublicProfile,
} from "@/lib/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Compact profile peek for future comment hover cards.
 * Usage: wrap a name with this and show on hover/focus.
 */
export function ProfilePeekCard({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) return;
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT)
        .eq("id", userId)
        .maybeSingle();
      if (!cancelled) setProfile((data as PublicProfile) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!profile) {
    return (
      <div className="w-72 rounded-2xl border border-white/10 bg-[#111214] p-3 text-sm text-mute shadow-xl">
        Loading…
      </div>
    );
  }

  const name = displayName(profile);
  const handle = handleFromProfile(profile);
  const accent = resolveAccentHex(profile);
  const ambient = accentAmbientEnabled(profile);
  const rgb = hexToRgbChannels(accent);

  return (
    <Link
      href={`/u/${profile.id}`}
      className="block w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#111214] shadow-[0_20px_50px_rgba(0,0,0,0.55)] transition hover:border-white/20"
      style={{
        boxShadow: ambient
          ? `0 20px 50px rgba(0,0,0,0.55), 0 0 40px rgba(${rgb}, 0.18)`
          : undefined,
      }}
    >
      <div className="relative h-16 bg-[#1e1f22]">
        {profile.banner_url ? (
          <Image
            src={profile.banner_url}
            alt=""
            fill
            className="object-cover opacity-90"
            sizes="288px"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, rgba(${rgb}, 0.7), #1a1b1e)`,
            }}
          />
        )}
      </div>
      <div className="relative -mt-7 px-3 pb-3">
        <div
          className="relative mb-2 h-12 w-12 overflow-hidden rounded-full bg-[#1e1f22]"
          style={{
            boxShadow: `0 0 0 3px #111214, 0 0 0 5px ${accent}`,
          }}
        >
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div
              className="grid h-full w-full place-items-center text-sm font-semibold"
              style={{ color: accent }}
            >
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <p className="truncate text-sm font-semibold text-snow">{name}</p>
        <p className="truncate text-[0.7rem] text-[#949ba4]">{handle}</p>
        {profile.bio ? (
          <p className="mt-1.5 line-clamp-2 text-[0.75rem] text-[#b5bac1]">
            {profile.bio}
          </p>
        ) : null}
        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.1em] text-[#6d6f78]">
          Member Since · {formatMemberSince(profile.created_at)}
        </p>
      </div>
    </Link>
  );
}
