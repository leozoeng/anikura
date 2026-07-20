"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { displayName, type PublicProfile } from "@/lib/profile";
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
        .select(
          "id, email, nickname, bio, avatar_url, banner_url, created_at",
        )
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
      <div className="w-64 rounded-2xl border border-white/10 bg-[#0c0c0e] p-3 text-sm text-mute shadow-xl">
        Loading…
      </div>
    );
  }

  const name = displayName(profile);

  return (
    <Link
      href={`/u/${profile.id}`}
      className="block w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e] shadow-[0_20px_50px_rgba(0,0,0,0.55)] transition hover:border-white/20"
    >
      <div className="relative h-16 bg-raised">
        {profile.banner_url ? (
          <Image
            src={profile.banner_url}
            alt=""
            fill
            className="object-cover opacity-80"
            sizes="256px"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,140,170,0.25),transparent_65%)]" />
        )}
      </div>
      <div className="relative -mt-6 px-3 pb-3">
        <div className="relative mb-2 h-12 w-12 overflow-hidden rounded-full bg-elevated ring-2 ring-[#0c0c0e]">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-sakura-soft">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <p className="truncate text-sm font-medium text-snow">{name}</p>
        {profile.bio ? (
          <p className="mt-1 line-clamp-2 text-[0.75rem] text-mute">
            {profile.bio}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
