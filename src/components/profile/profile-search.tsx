"use client";

import { SafeImage } from "@/components/safe-image";
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
  banner_url?: string | null;
  bio: string | null;
  badges: string[] | null;
  created_at: string;
};

function hasMedia(url: string | null | undefined): boolean {
  return Boolean(url && url.trim());
}

/** Prefer people who set avatar + banner so Suggested looks finished. */
function profileCompletenessRank(hit: SearchHit): number {
  const avatar = hasMedia(hit.avatar_url);
  const banner = hasMedia(hit.banner_url);
  if (avatar && banner) return 0;
  if (avatar) return 1;
  if (banner) return 2;
  return 3;
}

function sortByProfileCompleteness(hits: SearchHit[]): SearchHit[] {
  return [...hits].sort((a, b) => {
    const byLook = profileCompletenessRank(a) - profileCompletenessRank(b);
    if (byLook !== 0) return byLook;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

export function ProfileSearch({
  className = "",
  compact = false,
  excludeUserId = null,
}: {
  className?: string;
  /** Slimmer chrome for the Social side rail */
  compact?: boolean;
  /** Own profile id — omit from suggestions */
  excludeUserId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [suggestions, setSuggestions] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestVisible = compact ? 6 : 8;

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    void (async () => {
      try {
        const supabase = createClient();
        // Pull the RPC max, then keep the fullest-looking profiles on top.
        const { data, error: err } = await supabase.rpc("suggest_profiles", {
          p_limit: 16,
          p_exclude: excludeUserId ?? null,
        });
        if (cancelled) return;
        if (err) throw err;
        const ranked = sortByProfileCompleteness((data ?? []) as SearchHit[]);
        setSuggestions(ranked.slice(0, suggestVisible));
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [excludeUserId, suggestVisible]);

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
            p_limit: 24,
          });
          if (err) throw err;
          const rows = (data ?? []) as SearchHit[];
          const needle = q.toLowerCase();
          const ranked = [...rows].sort((a, b) => {
            const matchRank = (hit: SearchHit) => {
              const u = (hit.username ?? "").toLowerCase();
              if (u === needle) return 0;
              if (u.startsWith(needle)) return 1;
              return 2;
            };
            const byMatch = matchRank(a) - matchRank(b);
            if (byMatch !== 0) return byMatch;
            return profileCompletenessRank(a) - profileCompletenessRank(b);
          });
          setHits(ranked.slice(0, 12));
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

  const searching = query.trim().length > 0;
  const list = searching ? hits : suggestions;
  const listLabel = searching ? "Search results" : "Suggested people";

  return (
    <section
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] ${
        compact ? "p-3" : "p-3.5 sm:p-5"
      } ${className}`.trim()}
    >
      <div
        className={`flex items-end justify-between gap-3 ${
          compact ? "mb-2" : "mb-2.5 sm:mb-3"
        }`}
      >
        <div className="min-w-0">
          <h2
            className={`font-semibold tracking-[-0.02em] text-snow ${
              compact ? "text-sm" : "text-[0.95rem] sm:text-lg"
            }`}
          >
            Find people
          </h2>
          {!compact ? (
            <p className="mt-0.5 text-xs text-mute sm:text-sm">
              Search by @username or display name
            </p>
          ) : null}
        </div>
        {busy ? (
          <span className="shrink-0 text-xs text-mute">Searching…</span>
        ) : null}
      </div>

      <label className="relative block">
        <span className="sr-only">Search profiles</span>
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M11.2 11.2 14 14"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search @username…"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          aria-label="Search profiles by username or display name"
          className={`w-full border border-white/[0.1] bg-black/40 pl-10 pr-3.5 text-snow outline-none transition placeholder:text-mute focus:border-white/25 focus:bg-black/55 focus-visible:ring-2 focus-visible:ring-white/30 ${
            compact
              ? "min-h-11 rounded-xl py-2.5 text-sm"
              : "min-h-11 rounded-[14px] py-3 text-[0.9375rem] sm:rounded-xl sm:py-2.5 sm:text-sm"
          }`}
        />
      </label>

      {error ? (
        <p className="mt-3 text-sm text-[#ff6b6b]" role="alert">
          {error}
        </p>
      ) : null}

      {list.length > 0 || (searching && !busy) ? (
        <div className="mt-3">
          {!searching ? (
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#6d6f78]">
              Suggested
            </p>
          ) : null}
          <ul
            className="max-h-[min(16rem,40vh)] space-y-1.5 overflow-y-auto overscroll-contain pr-0.5 animate-rise"
            style={{ animationDuration: "0.28s" }}
            aria-label={listLabel}
          >
            {searching && hits.length === 0 && !busy ? (
              <li className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-mute">
                No profiles matched
              </li>
            ) : (
              list.map((hit) => (
                <PersonRow key={hit.id} hit={hit} />
              ))
            )}
          </ul>
        </div>
      ) : !searching && !compact ? (
        <p className="mt-2.5 text-[0.7rem] leading-relaxed text-mute sm:mt-3 sm:text-xs">
          Usernames are unique — once claimed, that @handle is yours.
        </p>
      ) : null}
    </section>
  );
}

function PersonRow({ hit }: { hit: SearchHit }) {
  const profile = {
    id: hit.id,
    username: hit.username,
    nickname: hit.nickname,
    badges: hit.badges,
  } as Pick<PublicProfile, "id" | "username" | "nickname" | "badges">;
  const name = displayName(profile);
  const handle = hit.username ? `@${hit.username}` : name;
  const badges = resolveProfileBadges({
    badges: hit.badges,
  });

  return (
    <li>
      <Link
        href={profileHref(profile)}
        aria-label={`View ${name}'s profile`}
        className="pressable flex min-h-11 items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition hover:border-white/[0.08] hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/10">
          {hit.avatar_url ? (
            <SafeImage
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
            <span className="truncate text-sm font-medium text-snow">{name}</span>
            <ProfileBadges badges={badges} size="sm" />
          </span>
          <span className="mt-0.5 block truncate text-xs text-mute">
            {handle}
            {hit.bio ? ` · ${hit.bio}` : ""}
          </span>
        </span>
      </Link>
    </li>
  );
}
