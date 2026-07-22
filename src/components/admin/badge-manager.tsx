"use client";

import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  listBadgedProfiles,
  listRecentSignups,
  searchProfilesForBadges,
  setProfileBadges,
  type AdminBadgeUser,
} from "@/app/admin/badge-actions";
import {
  ProfileBadges,
  PROFILE_BADGE_META,
} from "@/components/profile/profile-badges";
import {
  PROFILE_BADGE_ORDER,
  displayName,
  formatMemberSince,
  handleFromProfile,
  profileHref,
  type ProfileBadgeId,
} from "@/lib/profile";

type ListTab = "signups" | "badged";

function UserRow({
  user,
  busy,
  showJoined,
  onToggle,
}: {
  user: AdminBadgeUser;
  busy: boolean;
  showJoined?: boolean;
  onToggle: (userId: string, badge: ProfileBadgeId, next: boolean) => void;
}) {
  const name = displayName(user);
  const handle = handleFromProfile(user);

  return (
    <li className="flex flex-col gap-2.5 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/10">
          {user.avatar_url ? (
            <SafeImage
              src={user.avatar_url}
              alt=""
              fill
              className="object-cover"
              sizes="36px"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[0.7rem] font-semibold text-mute">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={profileHref(user)}
              className="truncate text-sm font-medium text-snow transition hover:underline"
            >
              {name}
            </Link>
            <ProfileBadges badges={user.badges} size="sm" />
          </div>
          <p className="truncate text-[0.7rem] text-mute">
            {handle}
            {user.email ? ` · ${user.email}` : ""}
            {user.role === "admin" ? " · admin" : ""}
          </p>
          {showJoined && user.created_at ? (
            <p className="mt-0.5 text-[0.65rem] text-mute/80">
              Joined {formatMemberSince(user.created_at)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:justify-end">
        <Link
          href={profileHref(user)}
          className="mr-0.5 rounded-md px-2 py-1 text-[0.7rem] text-mute transition hover:bg-white/[0.06] hover:text-snow"
        >
          Profile
        </Link>
        <div
          className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-black/25 p-1"
          role="group"
          aria-label="Assign badges"
        >
          {PROFILE_BADGE_ORDER.map((id) => {
            const meta = PROFILE_BADGE_META[id];
            const on = user.badges.includes(id);
            return (
              <button
                key={id}
                type="button"
                disabled={busy}
                title={`${on ? "Remove" : "Add"} ${meta.title}`}
                aria-pressed={on}
                aria-label={`${on ? "Remove" : "Add"} ${meta.title}`}
                onClick={() => onToggle(user.id, id, !on)}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition disabled:opacity-50 [&_svg]:h-[12px] [&_svg]:w-[12px] ${
                  on
                    ? `${meta.className} ring-1`
                    : "border-transparent bg-transparent text-mute/70 ring-0 hover:bg-white/[0.06] hover:text-cloud"
                }`}
              >
                {meta.icon}
              </button>
            );
          })}
        </div>
      </div>
    </li>
  );
}

export function BadgeManager() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ListTab>("signups");
  const [results, setResults] = useState<AdminBadgeUser[]>([]);
  const [signups, setSignups] = useState<AdminBadgeUser[]>([]);
  const [badged, setBadged] = useState<AdminBadgeUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refreshLists = useCallback(() => {
    startTransition(async () => {
      try {
        const [signupRows, badgedRows] = await Promise.all([
          listRecentSignups(50),
          listBadgedProfiles(),
        ]);
        setSignups(signupRows);
        setBadged(badgedRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn’t load users");
      }
    });
  }, []);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const t = setTimeout(() => {
      void (async () => {
        try {
          setError(null);
          const rows = await searchProfilesForBadges(q);
          setResults(rows);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Search failed");
          setResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 280);

    return () => clearTimeout(t);
  }, [query]);

  function patchUser(updated: AdminBadgeUser) {
    setResults((prev) =>
      prev.map((u) => (u.id === updated.id ? updated : u)),
    );
    setSignups((prev) =>
      prev.map((u) => (u.id === updated.id ? updated : u)),
    );
    setBadged((prev) => {
      const without = prev.filter((u) => u.id !== updated.id);
      if (updated.badges.length === 0) return without;
      return [updated, ...without];
    });
  }

  async function onToggle(
    userId: string,
    badge: ProfileBadgeId,
    nextOn: boolean,
  ) {
    const current =
      results.find((u) => u.id === userId) ??
      signups.find((u) => u.id === userId) ??
      badged.find((u) => u.id === userId);
    if (!current) return;

    const nextBadges = PROFILE_BADGE_ORDER.filter((id) => {
      if (id === badge) return nextOn;
      return current.badges.includes(id);
    });

    setBusyId(userId);
    setError(null);
    setMessage(null);
    try {
      const updated = await setProfileBadges(userId, nextBadges);
      patchUser(updated);
      setMessage(
        `${displayName(updated)} · ${
          nextBadges.length
            ? nextBadges.map((b) => b.toUpperCase()).join(", ")
            : "no badges"
        }`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  const showResults = query.trim().length > 0;
  const list = tab === "signups" ? signups : badged;

  return (
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg tracking-[-0.02em] text-snow">Members</h2>
          <p className="text-sm text-mute">
            Browse signups, open profiles, assign OG / Partner / Dev / VIP.
          </p>
        </div>
        <p className="text-xs text-mute">
          {PROFILE_BADGE_ORDER.map((b) => b.toUpperCase()).join(" · ")}
        </p>
      </div>

      <label className="block">
        <span className="sr-only">Search users</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or nickname…"
          className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-3.5 py-2.5 text-sm text-snow outline-none transition placeholder:text-mute focus:border-white/25"
        />
      </label>

      {error ? (
        <p className="mt-3 text-sm text-[#ff6b6b]" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm text-cloud">{message}</p>
      ) : null}

      {showResults ? (
        <div className="mt-4">
          <p className="mb-2 text-[0.7rem] uppercase tracking-[0.14em] text-mute">
            Search results
            {searching ? " · searching…" : ` · ${results.length}`}
          </p>
          {results.length === 0 && !searching ? (
            <p className="text-sm text-mute">No profiles matched.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  busy={busyId === user.id}
                  showJoined
                  onToggle={onToggle}
                />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-full border border-white/10 p-0.5">
              {(
                [
                  ["signups", "Recent signups"],
                  ["badged", "Badged"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    tab === key
                      ? "bg-snow text-void"
                      : "text-mute hover:text-snow"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={refreshLists}
              className="text-xs text-mute transition hover:text-cloud"
            >
              Refresh
            </button>
          </div>

          <p className="mb-2 text-[0.7rem] uppercase tracking-[0.14em] text-mute">
            {tab === "signups" ? "Newest accounts" : "Currently badged"}
            {pending ? " · loading…" : ` · ${list.length}`}
          </p>

          {list.length === 0 ? (
            <p className="text-sm text-mute">
              {tab === "signups"
                ? "No signups yet."
                : "No badges assigned yet. Open Recent signups or search a user."}
            </p>
          ) : (
            <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {list.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  busy={busyId === user.id}
                  showJoined={tab === "signups"}
                  onToggle={onToggle}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
