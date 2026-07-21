"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileBadges } from "@/components/profile/profile-badges";
import { createClient } from "@/lib/supabase/client";
import {
  displayName,
  profileHref,
  resolveProfileBadges,
  type PublicProfile,
} from "@/lib/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type SearchHit = {
  id: string;
  username: string | null;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  badges: string[] | null;
  created_at: string;
};

export function ProfileSearch({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const q = query.trim().replace(/^@+/, "");
    if (q.length < 1) {
      setHits([]);
      setBusy(false);
      setError(null);
      return;
    }

    setBusy(true);
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const supabase = createClient();
          const { data, error: err } = await supabase.rpc("search_profiles", {
            p_query: q,
            p_limit: 12,
          });
          if (err) throw err;
          setHits((data ?? []) as SearchHit[]);
          setError(null);
        } catch (err) {
          setHits([]);
          setError(err instanceof Error ? err.message : "Search failed");
        } finally {
          setBusy(false);
        }
      })();
    }, 220);

    return () => window.clearTimeout(t);
  }, [query]);

  return (
    <section
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5 ${className}`.trim()}
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em] text-snow sm:text-lg">
            Find people
          </h2>
          <p className="mt-0.5 text-sm text-mute">
            Search by @username or display name
          </p>
        </div>
        {busy ? (
          <span className="text-xs text-mute">Searching…</span>
        ) : null}
      </div>

      <label className="block">
        <span className="sr-only">Search profiles</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search @username…"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl border border-white/[0.1] bg-black/35 px-3.5 py-2.5 text-sm text-snow outline-none transition placeholder:text-mute focus:border-white/25"
        />
      </label>

      {error ? (
        <p className="mt-3 text-sm text-[#ff6b6b]" role="alert">
          {error}
        </p>
      ) : null}

      {query.trim() ? (
        <ul className="mt-3 max-h-[22rem] space-y-2 overflow-y-auto overscroll-contain pr-0.5">
          {hits.length === 0 && !busy ? (
            <li className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-mute">
              No profiles matched
            </li>
          ) : (
            hits.map((hit) => {
              const profile = {
                id: hit.id,
                username: hit.username,
                nickname: hit.nickname,
                email: null,
                badges: hit.badges,
              } as Pick<
                PublicProfile,
                "id" | "username" | "nickname" | "email" | "badges"
              >;
              const name = displayName(profile);
              const handle = hit.username ? `@${hit.username}` : name;
              const badges = resolveProfileBadges({
                email: null,
                badges: hit.badges,
              });

              return (
                <li key={hit.id}>
                  <Link
                    href={profileHref(profile)}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2.5 transition hover:border-white/15 hover:bg-white/[0.04]"
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/10">
                      {hit.avatar_url ? (
                        <Image
                          src={hit.avatar_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-xs font-semibold text-mute">
                          {name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-snow">
                          {name}
                        </span>
                        <ProfileBadges badges={badges} size="sm" />
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-mute">
                        {handle}
                        {hit.bio ? ` · ${hit.bio}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-mute">View</span>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-mute">
          Usernames are unique — once claimed, that @handle is yours.
        </p>
      )}
    </section>
  );
}
