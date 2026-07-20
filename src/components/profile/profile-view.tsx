"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  labelForStatus,
  type AnimeListEntry,
} from "@/lib/anime-list";
import {
  accentAmbientEnabled,
  displayName,
  formatMemberSince,
  handleFromProfile,
  hexToRgbChannels,
  resolveAccentHex,
  type PublicProfile,
} from "@/lib/profile";
import { ProfileEditPanel } from "@/components/profile/profile-edit-panel";

type Props = {
  profile: PublicProfile;
  list: AnimeListEntry[];
  isOwner: boolean;
};

type ProfileTab = "board" | "activity" | "wishlist";

type WidgetDef = {
  id: string;
  title: string;
  emptyHint: string;
  items: AnimeListEntry[];
  max: number;
};

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "activity", label: "Activity" },
  { id: "wishlist", label: "Wishlist" },
];

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatMemberSince(iso);
}

export function ProfileView({ profile, list, isOwner }: Props) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<ProfileTab>("board");
  const [live, setLive] = useState(profile);

  const name = displayName(live);
  const handle = handleFromProfile(live);
  const accent = resolveAccentHex(live);
  const ambient = accentAmbientEnabled(live);
  const rgb = hexToRgbChannels(accent);
  const memberSince = formatMemberSince(live.created_at);

  const favorites = useMemo(
    () => list.filter((x) => x.is_favorite).slice(0, 6),
    [list],
  );
  const watching = useMemo(
    () => list.filter((x) => x.status === "watching").slice(0, 6),
    [list],
  );
  const completed = useMemo(
    () => list.filter((x) => x.status === "completed").slice(0, 6),
    [list],
  );
  const onHold = useMemo(
    () => list.filter((x) => x.status === "on_hold").slice(0, 4),
    [list],
  );
  const planned = useMemo(
    () => list.filter((x) => x.status === "planned"),
    [list],
  );
  const activity = useMemo(
    () =>
      [...list]
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )
        .slice(0, 24),
    [list],
  );

  const widgets: WidgetDef[] = useMemo(
    () => [
      {
        id: "favorites",
        title: "Favorite anime",
        emptyHint: "Pin favorites from your list",
        items: favorites,
        max: 4,
      },
      {
        id: "watching",
        title: "Watching now",
        emptyHint: "Mark something as Watching",
        items: watching,
        max: 4,
      },
      {
        id: "completed",
        title: "Completed gems",
        emptyHint: "Finished titles show up here",
        items: completed,
        max: 4,
      },
      {
        id: "rotation",
        title: "In rotation",
        emptyHint: "On-hold series for later",
        items: onHold,
        max: 3,
      },
    ],
    [favorites, watching, completed, onHold],
  );

  return (
    <div className="relative px-3 pb-24 pt-8 sm:px-4 sm:pt-12">
      {/* Ambient wash behind the card */}
      {ambient ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-90"
          style={{
            background: `
              radial-gradient(720px 340px at 50% 8%, rgba(${rgb}, 0.28), transparent 62%),
              radial-gradient(520px 280px at 30% 40%, rgba(${rgb}, 0.12), transparent 70%),
              radial-gradient(480px 260px at 70% 30%, rgba(${rgb}, 0.1), transparent 68%)
            `,
          }}
        />
      ) : null}

      <div className="relative mx-auto w-full max-w-[1080px]">
        <div
          className="overflow-hidden rounded-[28px] border border-white/[0.08] shadow-[0_40px_100px_rgba(0,0,0,0.55)]"
          style={{
            background: ambient
              ? `linear-gradient(165deg, rgba(${rgb}, 0.14) 0%, #111214 28%, #0e0f12 100%)`
              : "#111214",
            boxShadow: ambient
              ? `0 40px 100px rgba(0,0,0,0.55), 0 0 80px rgba(${rgb}, 0.12)`
              : undefined,
          }}
        >
          <div className="grid lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
            {/* ── Left identity column ── */}
            <aside className="relative border-b border-white/[0.06] lg:border-b-0 lg:border-r lg:border-white/[0.06]">
              <div className="relative h-[140px] sm:h-[160px]">
                {live.banner_url ? (
                  <Image
                    src={live.banner_url}
                    alt=""
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 340px"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, rgba(${rgb}, 0.75), #1a1b1e 70%)`,
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111214]/80 via-transparent to-black/10" />

                {isOwner ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-[0.7rem] font-medium text-snow/90 backdrop-blur-md transition hover:bg-black/75"
                  >
                    Edit banner
                  </button>
                ) : null}
              </div>

              <div className="relative px-5 pb-6 pt-0">
                {/* Avatar overlapping banner */}
                <div
                  className="-mt-12 inline-flex rounded-full p-[6px]"
                  style={{
                    background: "#111214",
                    boxShadow: ambient
                      ? `0 0 0 3px rgba(${rgb}, 0.55), 0 0 28px rgba(${rgb}, 0.35)`
                      : `0 0 0 3px ${accent}`,
                  }}
                >
                  <div className="relative h-[92px] w-[92px] overflow-hidden rounded-full bg-[#1e1f22]">
                    {live.avatar_url ? (
                      <Image
                        src={live.avatar_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="92px"
                      />
                    ) : (
                      <div
                        className="grid h-full w-full place-items-center text-3xl font-semibold"
                        style={{ color: accent }}
                      >
                        {name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <h1 className="truncate text-[1.55rem] font-bold leading-tight tracking-[-0.03em] text-snow">
                    {name}
                  </h1>
                  <p className="mt-0.5 truncate text-sm text-[#b5bac1]">
                    {handle}
                  </p>
                </div>

                {isOwner ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="rounded-full bg-snow px-4 py-2 text-sm font-medium text-void transition hover:bg-white"
                    >
                      Edit profile
                    </button>
                  </div>
                ) : null}

                {/* About */}
                <section className="mt-5 rounded-2xl bg-[#1e1f22]/90 px-3.5 py-3.5 ring-1 ring-white/[0.04]">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#949ba4]">
                    About Me
                  </p>
                  {live.bio ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#dbdee1]">
                      {live.bio}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-[#6d6f78]">
                      {isOwner
                        ? "Add a short bio from Edit profile."
                        : "No bio yet."}
                    </p>
                  )}
                </section>

                {/* Member Since */}
                <section className="mt-3 rounded-2xl bg-[#1e1f22]/90 px-3.5 py-3.5 ring-1 ring-white/[0.04]">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#949ba4]">
                    Member Since
                  </p>
                  <p className="mt-2 text-sm text-[#dbdee1]">
                    Anikura · {memberSince}
                  </p>
                </section>

                {/* Connections-style list summary */}
                <section className="mt-3 rounded-2xl bg-[#1e1f22]/90 px-3.5 py-3.5 ring-1 ring-white/[0.04]">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#949ba4]">
                    Library
                  </p>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    {(
                      [
                        ["Watching", watching.length],
                        ["Completed", completed.length],
                        ["Wishlist", planned.length],
                        ["Favorites", favorites.length],
                      ] as const
                    ).map(([label, count]) => (
                      <div
                        key={label}
                        className="rounded-xl bg-black/25 px-2.5 py-2"
                      >
                        <p className="text-[0.65rem] text-[#949ba4]">{label}</p>
                        <p className="text-sm font-semibold text-snow">
                          {count}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </aside>

            {/* ── Right content column ── */}
            <div className="flex min-h-[420px] flex-col bg-[#0e0f12]/40">
              <div className="flex items-center gap-1 border-b border-white/[0.06] px-4 pt-3 sm:px-5">
                {TABS.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`relative px-3.5 py-2.5 text-sm font-medium transition ${
                        active
                          ? "text-snow"
                          : "text-[#949ba4] hover:text-[#dbdee1]"
                      }`}
                    >
                      {t.label}
                      {active ? (
                        <span
                          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                          style={{ background: accent }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {tab === "board" ? (
                  <BoardTab
                    widgets={widgets}
                    isOwner={isOwner}
                    accent={accent}
                    rgb={rgb}
                  />
                ) : null}
                {tab === "activity" ? (
                  <ActivityTab
                    items={activity}
                    isOwner={isOwner}
                    accent={accent}
                  />
                ) : null}
                {tab === "wishlist" ? (
                  <WishlistTab
                    items={planned}
                    favorites={favorites}
                    isOwner={isOwner}
                    accent={accent}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {editing && isOwner ? (
          <div className="mt-6">
            <ProfileEditPanel
              profile={live}
              onSaved={(next) => {
                setLive(next);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BoardTab({
  widgets,
  isOwner,
  accent,
  rgb,
}: {
  widgets: WidgetDef[];
  isOwner: boolean;
  accent: string;
  rgb: string;
}) {
  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-snow">Profile board</h2>
          <p className="mt-0.5 text-sm text-[#949ba4]">
            {isOwner
              ? "Customise your profile with widgets from your list."
              : "Showcase shelves from this viewer’s list."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {widgets.map((w) => (
          <WidgetCard
            key={w.id}
            widget={w}
            isOwner={isOwner}
            accent={accent}
            rgb={rgb}
          />
        ))}
      </div>
    </div>
  );
}

function WidgetCard({
  widget,
  isOwner,
  accent,
  rgb,
}: {
  widget: WidgetDef;
  isOwner: boolean;
  accent: string;
  rgb: string;
}) {
  const filled = widget.items.slice(0, widget.max);
  const emptyCount = Math.max(0, widget.max - filled.length);

  return (
    <div
      className="rounded-2xl bg-[#1e1f22]/95 p-3.5 ring-1 ring-white/[0.05]"
      style={{
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(${rgb}, 0.04)`,
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#949ba4]">
          {widget.title}
        </p>
        <span className="text-[0.7rem] text-[#6d6f78]">
          {filled.length}/{widget.max}
        </span>
      </div>

      {filled.length === 0 && emptyCount === 0 ? null : (
        <div className="grid grid-cols-4 gap-2">
          {filled.map((item) => (
            <Link
              key={item.id}
              href={`/anime/${item.anime_id}/${item.slug}`}
              className="group relative aspect-[2/3] overflow-hidden rounded-xl bg-[#111214] ring-1 ring-white/8 transition hover:ring-white/25"
            >
              {item.poster ? (
                <Image
                  src={item.poster}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  sizes="80px"
                />
              ) : null}
            </Link>
          ))}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <EmptySlot
              key={`empty-${widget.id}-${i}`}
              isOwner={isOwner}
              hint={widget.emptyHint}
              accent={accent}
            />
          ))}
        </div>
      )}

      {filled.length === 0 ? (
        <p className="mt-2 text-xs text-[#6d6f78]">{widget.emptyHint}</p>
      ) : null}
    </div>
  );
}

function EmptySlot({
  isOwner,
  hint,
  accent,
}: {
  isOwner: boolean;
  hint: string;
  accent: string;
}) {
  if (!isOwner) {
    return (
      <div className="aspect-[2/3] rounded-xl bg-white/[0.03] ring-1 ring-dashed ring-white/10" />
    );
  }
  return (
    <Link
      href="/browse"
      title={hint}
      className="grid aspect-[2/3] place-items-center rounded-xl bg-white/[0.03] text-lg text-[#6d6f78] ring-1 ring-dashed ring-white/15 transition hover:bg-white/[0.06] hover:text-snow"
      style={{ borderColor: `${accent}33` }}
    >
      +
    </Link>
  );
}

function ActivityTab({
  items,
  isOwner,
  accent,
}: {
  items: AnimeListEntry[];
  isOwner: boolean;
  accent: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No recent activity"
        body={
          isOwner
            ? "Update a title’s status from Browse or a series page — it will show up here."
            : "This viewer hasn’t updated their list yet."
        }
      />
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-snow">Recent activity</h2>
      <p className="mb-4 text-sm text-[#949ba4]">
        List updates and status changes.
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/anime/${item.anime_id}/${item.slug}`}
              className="flex items-center gap-3 rounded-2xl bg-[#1e1f22]/90 p-2.5 ring-1 ring-white/[0.04] transition hover:bg-[#232428] hover:ring-white/[0.08]"
            >
              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-[#111214]">
                {item.poster ? (
                  <Image
                    src={item.poster}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-snow">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-[#949ba4]">
                  <span style={{ color: accent }}>
                    {item.is_favorite ? "★ " : ""}
                    {labelForStatus(item.status)}
                  </span>
                  <span className="text-[#6d6f78]">
                    {" "}
                    · {relativeTime(item.updated_at)}
                  </span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WishlistTab({
  items,
  favorites,
  isOwner,
  accent,
}: {
  items: AnimeListEntry[];
  favorites: AnimeListEntry[];
  isOwner: boolean;
  accent: string;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 text-base font-semibold text-snow">Wishlist</h2>
        <p className="mb-4 text-sm text-[#949ba4]">
          Plan to watch — titles queued for later.
        </p>
        {items.length === 0 ? (
          <EmptyState
            title="Wishlist is empty"
            body={
              isOwner
                ? "Mark titles as Plan to watch to fill this shelf."
                : "Nothing planned yet."
            }
            compact
          />
        ) : (
          <PosterGrid items={items} accent={accent} />
        )}
      </div>

      {favorites.length > 0 ? (
        <div>
          <h2 className="mb-1 text-base font-semibold text-snow">Favorites</h2>
          <p className="mb-4 text-sm text-[#949ba4]">Starred titles.</p>
          <PosterGrid items={favorites} accent={accent} />
        </div>
      ) : null}
    </div>
  );
}

function PosterGrid({
  items,
  accent,
}: {
  items: AnimeListEntry[];
  accent: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/anime/${item.anime_id}/${item.slug}`}
          className="group block"
        >
          <div
            className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-[#1e1f22] ring-1 ring-white/8 transition duration-500 group-hover:-translate-y-0.5 group-hover:ring-white/25"
            style={{
              boxShadow: `0 0 0 0 transparent`,
            }}
          >
            {item.poster ? (
              <Image
                src={item.poster}
                alt=""
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
                sizes="140px"
              />
            ) : null}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pb-2 pt-6">
              <p
                className="truncate text-[0.6rem] uppercase tracking-[0.1em]"
                style={{ color: accent }}
              >
                {item.is_favorite ? "★ " : ""}
                {labelForStatus(item.status)}
              </p>
            </div>
          </div>
          <p className="mt-2 line-clamp-2 text-xs tracking-[-0.01em] text-[#dbdee1] transition group-hover:text-snow">
            {item.title}
          </p>
        </Link>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  compact,
}: {
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center ${
        compact ? "px-4 py-8" : "px-6 py-14"
      }`}
    >
      <p className="text-sm font-medium text-[#dbdee1]">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-[#6d6f78]">{body}</p>
    </div>
  );
}
