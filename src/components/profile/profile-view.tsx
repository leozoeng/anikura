"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AnimeListEntry } from "@/lib/anime-list";
import {
  accentAmbientEnabled,
  displayName,
  formatMemberSince,
  handleFromProfile,
  hexToRgbChannels,
  resolveAccentHex,
  resolveProfileBadges,
  type PublicProfile,
} from "@/lib/profile";
import {
  getContinueWatching,
  type WatchProgress,
} from "@/lib/progress";
import { ProfileBadges } from "@/components/profile/profile-badges";
import { ProfileEditPanel } from "@/components/profile/profile-edit-panel";

type Props = {
  profile: PublicProfile;
  list: AnimeListEntry[];
  isOwner: boolean;
  /** Signed-in viewer looking at someone else — show Quit → /profile */
  showQuitProfile?: boolean;
};

type ProfileTab = "board" | "activity" | "watch";

type WidgetDef = {
  id: string;
  title: string;
  emptyHint: string;
  items: AnimeListEntry[];
  max: number;
};

/** Per-shelf poster cap on the profile board. */
const BOARD_SHELF_MAX = 12;

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "activity", label: "Activity" },
  { id: "watch", label: "Watch" },
];

function relativeTime(ms: number) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatMemberSince(new Date(ms).toISOString());
}

export function ProfileView({
  profile,
  list,
  isOwner,
  showQuitProfile = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<ProfileTab>("board");
  const [live, setLive] = useState(profile);
  const [episodes, setEpisodes] = useState<WatchProgress[]>([]);

  const name = displayName(live);
  const handle = handleFromProfile(live);
  const accent = resolveAccentHex(live);
  const ambient = accentAmbientEnabled(live);
  const rgb = hexToRgbChannels(accent);
  const memberSince = formatMemberSince(live.created_at);
  const badges = resolveProfileBadges(live);

  useEffect(() => {
    if (!isOwner) {
      setEpisodes([]);
      return;
    }
    const sync = () => setEpisodes(getContinueWatching());
    sync();
    window.addEventListener("anikura:progress", sync);
    return () => window.removeEventListener("anikura:progress", sync);
  }, [isOwner]);

  const favorites = useMemo(
    () => list.filter((x) => x.is_favorite),
    [list],
  );
  const watching = useMemo(
    () => list.filter((x) => x.status === "watching"),
    [list],
  );
  const completed = useMemo(
    () => list.filter((x) => x.status === "completed"),
    [list],
  );
  const planned = useMemo(
    () => list.filter((x) => x.status === "planned"),
    [list],
  );
  const onHold = useMemo(
    () => list.filter((x) => x.status === "on_hold"),
    [list],
  );

  const continueStrip = useMemo(() => episodes.slice(0, 4), [episodes]);

  const widgets: WidgetDef[] = useMemo(
    () => [
      {
        id: "favorites",
        title: "Favourites",
        emptyHint: "Star a title from the heart menu",
        items: favorites,
        max: BOARD_SHELF_MAX,
      },
      {
        id: "watching",
        title: "Watching",
        emptyHint: "Mark a title as Watching",
        items: watching,
        max: BOARD_SHELF_MAX,
      },
      {
        id: "completed",
        title: "Completed",
        emptyHint: "Finished titles show up here",
        items: completed,
        max: BOARD_SHELF_MAX,
      },
      {
        id: "on_hold",
        title: "On hold",
        emptyHint: "Paused titles land here",
        items: onHold,
        max: BOARD_SHELF_MAX,
      },
    ],
    [favorites, watching, completed, onHold],
  );

  return (
    <div className="relative px-3 pb-24 pt-16 sm:px-4 sm:pt-20">
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
        {showQuitProfile ? (
          <div className="sticky top-14 z-30 mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-void/85 px-3.5 py-2.5 backdrop-blur-md sm:top-16 sm:px-4">
            <p className="min-w-0 truncate text-sm text-[#b5bac1]">
              Viewing{" "}
              <span className="font-medium text-snow">{name}</span>
            </p>
            <Link
              href="/profile"
              className="shrink-0 rounded-full bg-white/[0.08] px-3.5 py-1.5 text-[0.8125rem] font-medium text-snow transition hover:bg-white/[0.12]"
            >
              Quit profile
            </Link>
          </div>
        ) : null}

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
              </div>

              <div className="relative px-5 pb-6 pt-0">
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

                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                      <h1 className="truncate text-[1.55rem] font-bold leading-tight tracking-[-0.03em] text-snow">
                        {name}
                      </h1>
                      <ProfileBadges badges={badges} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-[#b5bac1]">
                      {handle}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-[#6d6f78]">
                      Anikura · {memberSince}
                    </p>
                  </div>
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="mt-1 shrink-0 rounded-md px-1.5 py-0.5 text-[0.7rem] font-medium text-[#949ba4] transition hover:bg-white/[0.06] hover:text-[#dbdee1]"
                    >
                      Edit Profile
                    </button>
                  ) : null}
                </div>

                <section className="mt-4 rounded-2xl bg-[#1e1f22]/90 px-3.5 py-2.5 ring-1 ring-white/[0.04]">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#949ba4]">
                    About Me
                  </p>
                  {live.bio ? (
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#dbdee1]">
                      {live.bio}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-[#6d6f78]">
                      {isOwner ? "Add a short bio from Edit Profile." : "No bio yet."}
                    </p>
                  )}
                </section>

                {isOwner && continueStrip.length > 0 ? (
                  <section className="mt-3 rounded-2xl bg-[#1e1f22]/90 px-3.5 py-3 ring-1 ring-white/[0.04]">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#949ba4]">
                        Continue
                      </p>
                      <button
                        type="button"
                        onClick={() => setTab("activity")}
                        className="text-[0.65rem] font-medium text-[#949ba4] transition hover:text-[#dbdee1]"
                      >
                        See all
                      </button>
                    </div>
                    <div className="scrollbar-none -mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-0.5">
                      {continueStrip.map((item) => (
                        <Link
                          key={`${item.id}-${item.episode}-${item.language}`}
                          href={`/watch/${item.id}/${item.slug}?ep=${item.episode}&lang=${item.language}`}
                          className="group w-[3.25rem] shrink-0 sm:w-[3.5rem]"
                          title={`${item.title} · Episode ${item.episode}`}
                        >
                          <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-[#111214] ring-1 ring-white/8 transition group-hover:ring-white/25">
                            {item.poster ? (
                              <Image
                                src={item.poster}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            ) : null}
                            {item.percent > 0 && item.percent < 100 ? (
                              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-black/50">
                                <div
                                  className="h-full bg-white"
                                  style={{
                                    width: `${Math.min(100, item.percent)}%`,
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-0.5 pb-0.5 pt-3">
                                <p className="truncate text-center text-[0.5rem] font-medium text-white/90">
                                  E{item.episode}
                                </p>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </aside>

            <div className="flex min-h-[360px] flex-col bg-[#0e0f12]/40">
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
                    items={episodes}
                    isOwner={isOwner}
                    accent={accent}
                  />
                ) : null}
                {tab === "watch" ? (
                  <WatchTab
                    items={planned}
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
      <div className="mb-3">
        <h2 className="text-base font-semibold text-snow">Profile board</h2>
        <p className="mt-0.5 text-sm text-[#949ba4]">
          {isOwner
            ? "Shelves from your list."
            : "Shelves from this viewer’s list."}
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
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
  const showAdd = isOwner && filled.length < widget.max;
  const empty = filled.length === 0;

  return (
    <div
      className={`rounded-2xl bg-[#1e1f22]/95 ring-1 ring-white/[0.05] ${
        empty ? "px-3.5 py-3" : "p-3.5"
      }`}
      style={{
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(${rgb}, 0.04)`,
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#949ba4]">
          {widget.title}
        </p>
        <span className="text-[0.7rem] tabular-nums text-[#6d6f78]">
          {filled.length}/{widget.max}
        </span>
      </div>

      {empty ? (
        <div className="flex items-center gap-2.5">
          {showAdd ? (
            <EmptySlot hint={widget.emptyHint} accent={accent} compact />
          ) : null}
          <p className="min-w-0 flex-1 text-xs leading-snug text-[#6d6f78]">
            {widget.emptyHint}
          </p>
        </div>
      ) : (
        <div className="scrollbar-none -mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-0.5">
          {filled.map((item) => (
            <Link
              key={item.id}
              href={`/anime/${item.anime_id}/${item.slug}`}
              className="group relative aspect-[2/3] w-[4.25rem] shrink-0 overflow-hidden rounded-lg bg-[#111214] ring-1 ring-white/8 transition hover:ring-white/25 sm:w-[4.75rem]"
            >
              {item.poster ? (
                <Image
                  src={item.poster}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  sizes="76px"
                />
              ) : null}
            </Link>
          ))}
          {showAdd ? (
            <EmptySlot hint={widget.emptyHint} accent={accent} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function EmptySlot({
  hint,
  accent,
  compact = false,
}: {
  hint: string;
  accent: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/browse"
      title={hint}
      className={`grid shrink-0 place-items-center rounded-lg bg-white/[0.03] text-[#6d6f78] ring-1 ring-dashed ring-white/15 transition hover:bg-white/[0.06] hover:text-snow ${
        compact
          ? "h-10 w-10 text-base"
          : "aspect-[2/3] w-[4.25rem] text-lg sm:w-[4.75rem]"
      }`}
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
  items: WatchProgress[];
  isOwner: boolean;
  accent: string;
}) {
  if (!isOwner) {
    return (
      <EmptyState
        title="Episode activity is private"
        body="Recently watched episodes stay on this viewer’s device."
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No episodes yet"
        body="Watch something — recently played episodes show up here."
      />
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-snow">
        Recently watched
      </h2>
      <p className="mb-4 text-sm text-[#949ba4]">
        Episodes you’ve been watching.
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={`${item.id}-${item.episode}-${item.language}-${item.updatedAt}`}>
            <Link
              href={`/watch/${item.id}/${item.slug}?ep=${item.episode}&lang=${item.language}`}
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
                    Episode {item.episode}
                  </span>
                  <span className="text-[#6d6f78]">
                    {" "}
                    · {item.language.toUpperCase()}
                    {" · "}
                    {relativeTime(item.updatedAt)}
                  </span>
                </p>
              </div>
              {item.percent > 0 && item.percent < 100 ? (
                <div className="hidden w-16 shrink-0 sm:block">
                  <div className="h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, item.percent)}%`,
                        background: accent,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WatchTab({
  items,
  isOwner,
  accent,
}: {
  items: AnimeListEntry[];
  isOwner: boolean;
  accent: string;
}) {
  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-snow">Plan to watch</h2>
      <p className="mb-4 text-sm text-[#949ba4]">
        Series queued for later.
      </p>
      {items.length === 0 ? (
        <EmptyState
          title="Queue is empty"
          body={
            isOwner
              ? "Mark titles as Plan to watch from the heart menu."
              : "Nothing planned yet."
          }
          compact
        />
      ) : (
        <PosterGrid items={items} accent={accent} />
      )}
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
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-[#1e1f22] ring-1 ring-white/8 transition duration-500 group-hover:-translate-y-0.5 group-hover:ring-white/25">
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
                Plan to watch
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
