"use client";

import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  listBadgedProfiles,
  listDiscordPending,
  listRecentSignups,
  searchProfilesForBadges,
  setProfileBadges,
  type AdminBadgeUser,
} from "@/app/admin/badge-actions";
import {
  deleteUserAccount,
  endUserSessions,
  revokeDiscordVerification,
} from "@/app/admin/user-actions";
import { useAdminFeedback } from "@/components/admin/admin-feedback";
import {
  ProfileBadges,
  PROFILE_BADGE_META,
} from "@/components/profile/profile-badges";
import {
  PROFILE_BADGE_ORDER,
  adminDisplayName,
  formatMemberSince,
  handleFromProfile,
  profileHref,
  type ProfileBadgeId,
} from "@/lib/profile";

type ListTab = "signups" | "badged" | "discord";

function DiscordStatus({ user }: { user: AdminBadgeUser }) {
  if (user.discord_verified_at) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-1.5 py-0.5 text-[0.65rem] font-medium text-emerald-200"
        title={
          user.discord_id
            ? `Discord verified · ${user.discord_id}`
            : "Discord verified + in server"
        }
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
        Discord ✓
      </span>
    );
  }
  if (user.discord_id) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[0.65rem] font-medium text-amber-100"
        title="Linked Discord but not verified in the Anikura server"
      >
        Linked · not verified
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[0.65rem] font-medium text-mute"
      title="No Discord linked yet"
    >
      No Discord
    </span>
  );
}

function UserRow({
  user,
  busy,
  showJoined,
  onToggle,
  onEndSessions,
  onDelete,
  onRevokeDiscord,
}: {
  user: AdminBadgeUser;
  busy: boolean;
  showJoined?: boolean;
  onToggle: (userId: string, badge: ProfileBadgeId, next: boolean) => void;
  onEndSessions: (userId: string) => void;
  onDelete: (user: AdminBadgeUser) => void;
  onRevokeDiscord: (user: AdminBadgeUser) => void;
}) {
  const name = adminDisplayName(user);
  const handle = handleFromProfile(user);

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 transition duration-200 hover:border-white/[0.1] hover:bg-black/35 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
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
            <DiscordStatus user={user} />
          </div>
          <p className="truncate text-[0.7rem] text-mute">
            {[
              user.email,
              user.username ? `@${user.username}` : null,
              user.role === "admin" ? "admin" : null,
            ]
              .filter(Boolean)
              .join(" · ") || handle}
          </p>
          {showJoined && user.created_at ? (
            <p className="mt-0.5 text-[0.65rem] text-mute/80">
              Joined {formatMemberSince(user.created_at)}
              {user.discord_verified_at
                ? ` · Discord ${formatMemberSince(user.discord_verified_at)}`
                : ""}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
        <Link
          href={profileHref(user)}
          className="rounded-md px-2 py-1 text-[0.7rem] text-mute transition hover:bg-white/[0.06] hover:text-snow"
        >
          Profile
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={() => onEndSessions(user.id)}
          className="rounded-md px-2 py-1 text-[0.7rem] text-mute transition hover:bg-white/[0.06] hover:text-snow disabled:opacity-50"
        >
          End sessions
        </button>
        {(user.discord_verified_at || user.discord_id) &&
        user.role !== "admin" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onRevokeDiscord(user)}
            title="Clear Discord verify — they must link and join again"
            className="rounded-md px-2 py-1 text-[0.7rem] text-amber-200/80 transition hover:bg-amber-500/10 hover:text-amber-100 disabled:opacity-50"
          >
            Reset Discord
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy || user.role === "admin"}
          onClick={() => onDelete(user)}
          title={
            user.role === "admin" ? "Admin accounts are protected" : "Delete account"
          }
          className="rounded-md px-2 py-1 text-[0.7rem] text-red-300/80 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-40"
        >
          Delete
        </button>
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

function SkeletonRows({ n = 4 }: { n?: number }) {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <li
          key={i}
          className="h-[3.25rem] animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.03]"
        />
      ))}
    </ul>
  );
}

export function BadgeManager() {
  const { toast } = useAdminFeedback();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ListTab>("signups");
  const [results, setResults] = useState<AdminBadgeUser[]>([]);
  const [signups, setSignups] = useState<AdminBadgeUser[]>([]);
  const [badged, setBadged] = useState<AdminBadgeUser[]>([]);
  const [discordPending, setDiscordPending] = useState<AdminBadgeUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  const refreshLists = useCallback(() => {
    startTransition(async () => {
      try {
        const [signupRows, badgedRows, pendingRows] = await Promise.all([
          listRecentSignups(50),
          listBadgedProfiles(),
          listDiscordPending(50),
        ]);
        setSignups(signupRows);
        setBadged(badgedRows);
        setDiscordPending(pendingRows);
        setLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn’t load users");
        setLoaded(true);
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
    setDiscordPending((prev) => {
      const without = prev.filter((u) => u.id !== updated.id);
      if (updated.discord_verified_at) return without;
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
    try {
      const updated = await setProfileBadges(userId, nextBadges);
      patchUser(updated);
      toast(
        `${adminDisplayName(updated)} · ${
          nextBadges.length
            ? nextBadges.map((b) => b.toUpperCase()).join(", ")
            : "no badges"
        }`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setError(msg);
      toast(msg, "err");
    } finally {
      setBusyId(null);
    }
  }

  async function onEndSessions(userId: string) {
    setBusyId(userId);
    setError(null);
    try {
      await endUserSessions({ userId });
      toast("Sessions ended — they must sign in again");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn’t end sessions";
      setError(msg);
      toast(msg, "err");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(user: AdminBadgeUser) {
    const label = adminDisplayName(user);
    const ok = window.confirm(
      `Delete ${label}${user.email ? ` (${user.email})` : ""} permanently?\n\nThis removes their account and profile. It cannot be undone.`,
    );
    if (!ok) return;

    setBusyId(user.id);
    setError(null);
    try {
      await deleteUserAccount(user.id);
      setResults((prev) => prev.filter((u) => u.id !== user.id));
      setSignups((prev) => prev.filter((u) => u.id !== user.id));
      setBadged((prev) => prev.filter((u) => u.id !== user.id));
      setDiscordPending((prev) => prev.filter((u) => u.id !== user.id));
      toast(`${label} deleted`, "ok");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn’t delete account";
      setError(msg);
      toast(msg, "err");
    } finally {
      setBusyId(null);
    }
  }

  async function onRevokeDiscord(user: AdminBadgeUser) {
    const label = adminDisplayName(user);
    const ok = window.confirm(
      `Reset Discord for ${label}?\n\nThey must link Discord and join the server again on their next visit.`,
    );
    if (!ok) return;

    setBusyId(user.id);
    setError(null);
    try {
      await revokeDiscordVerification(user.id);
      const cleared: AdminBadgeUser = {
        ...user,
        discord_id: null,
        discord_verified_at: null,
      };
      patchUser(cleared);
      toast(`${label} · Discord reset — must verify again`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Couldn’t reset Discord";
      setError(msg);
      toast(msg, "err");
    } finally {
      setBusyId(null);
    }
  }

  const showResults = query.trim().length > 0;
  const list =
    tab === "signups"
      ? signups
      : tab === "badged"
        ? badged
        : discordPending;

  return (
    <section className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 transition duration-300 hover:border-white/[0.12] sm:p-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[0.95rem] tracking-[-0.02em] text-snow">Members</h2>
          <p className="text-xs text-mute">
            Browse signups, Discord status, badges — Admin / Mod / OG / Partner /
            Dev / VIP.
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
          placeholder="Search email, @username, or nickname…"
          className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-3.5 py-2.5 text-sm text-snow outline-none transition duration-200 placeholder:text-mute focus:border-white/25"
        />
      </label>

      {error ? (
        <div
          className="mt-3 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2.5 text-sm text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {showResults ? (
        <div className="mt-4">
          <p className="mb-2 text-[0.7rem] uppercase tracking-[0.14em] text-mute">
            Search results
            {searching ? " · searching…" : ` · ${results.length}`}
          </p>
          {searching && results.length === 0 ? (
            <SkeletonRows n={3} />
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-black/20 px-4 py-8 text-center">
              <p className="text-sm text-cloud">No profiles matched</p>
              <p className="mt-1 text-xs text-mute">
                Try another email, @username, or nickname fragment.
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {results.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  busy={busyId === user.id}
                  showJoined
                  onToggle={onToggle}
                  onEndSessions={onEndSessions}
                  onDelete={onDelete}
                  onRevokeDiscord={onRevokeDiscord}
                />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap rounded-full border border-white/10 p-0.5">
              {(
                [
                  ["signups", "Recent signups"],
                  ["discord", `Needs Discord${discordPending.length ? ` · ${discordPending.length}` : ""}`],
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
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs text-mute transition hover:border-white/20 hover:text-cloud disabled:opacity-50"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full bg-snow ${
                  pending ? "animate-pulse" : "opacity-40"
                }`}
              />
              {pending ? "Loading" : "Refresh"}
            </button>
          </div>

          <p className="mb-2 text-[0.7rem] uppercase tracking-[0.14em] text-mute">
            {tab === "signups"
              ? "Newest accounts"
              : tab === "discord"
                ? "Not Discord-verified yet"
                : "Currently badged"}
            {pending && !loaded ? " · loading…" : ` · ${list.length}`}
          </p>

          {!loaded && pending ? (
            <SkeletonRows />
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-black/20 px-4 py-8 text-center">
              <p className="text-sm text-cloud">
                {tab === "signups"
                  ? "No signups yet"
                  : tab === "discord"
                    ? "Everyone here is Discord-verified"
                    : "No badges assigned"}
              </p>
              <p className="mt-1 text-xs text-mute">
                {tab === "signups"
                  ? "New accounts will land here as people join."
                  : tab === "discord"
                    ? "Anyone who hasn’t linked + joined will appear here."
                    : "Open Recent signups or search a user to assign badges."}
              </p>
            </div>
          ) : (
            <ul className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
              {list.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  busy={busyId === user.id}
                  showJoined={tab === "signups" || tab === "discord"}
                  onToggle={onToggle}
                  onEndSessions={onEndSessions}
                  onDelete={onDelete}
                  onRevokeDiscord={onRevokeDiscord}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
