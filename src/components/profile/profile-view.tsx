"use client";

import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AnimeListEntry } from "@/lib/anime-list";
import {
  formatCommentTime,
  type ProfileCommentItem,
} from "@/lib/comments";
import { ANIKURA_DISCORD_INVITE } from "@/lib/discord-partners";
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
import { ProfileSearch } from "@/components/profile/profile-search";
import { CommunityPartnersMarquee } from "@/components/social/community-partners-marquee";

type Props = {
  profile: PublicProfile;
  list: AnimeListEntry[];
  comments?: ProfileCommentItem[];
  isOwner: boolean;
  /** Signed-in viewer looking at someone else — show Quit → /profile */
  showQuitProfile?: boolean;
  /** Social page chrome: Find people + Discord rail + partners */
  showSocialRail?: boolean;
};

type ProfileTab = "board" | "activity" | "watch" | "comments";

type WidgetDef = {
  id: string;
  title: string;
  /** Owner-facing action label for empty / + slots */
  addLabel: string;
  /** Visitor empty copy */
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
  { id: "comments", label: "Comments" },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111214]";

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
  comments = [],
  isOwner,
  showQuitProfile = false,
  showSocialRail = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<ProfileTab>("board");
  const [live, setLive] = useState(profile);
  const [episodes, setEpisodes] = useState<WatchProgress[]>([]);
  const tabRefs = useRef<Partial<Record<ProfileTab, HTMLButtonElement | null>>>(
    {},
  );

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

  useEffect(() => {
    const el = tabRefs.current[tab];
    if (!el) return;
    el.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [tab]);

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

  const continueStrip = useMemo(() => episodes.slice(0, 5), [episodes]);

  const widgets: WidgetDef[] = useMemo(
    () => [
      {
        id: "favorites",
        title: "Favourites",
        addLabel: "Add a favourite",
        emptyHint: "No favourites yet",
        items: favorites,
        max: BOARD_SHELF_MAX,
      },
      {
        id: "watching",
        title: "Watching",
        addLabel: "Add from browse",
        emptyHint: "Nothing watching",
        items: watching,
        max: BOARD_SHELF_MAX,
      },
      {
        id: "completed",
        title: "Completed",
        addLabel: "Add a finished title",
        emptyHint: "No completed titles",
        items: completed,
        max: BOARD_SHELF_MAX,
      },
      {
        id: "on_hold",
        title: "On Hold",
        addLabel: "Park a title",
        emptyHint: "Nothing on hold",
        items: onHold,
        max: BOARD_SHELF_MAX,
      },
    ],
    [favorites, watching, completed, onHold],
  );

  const profileColumn = (
    <>
      <div
        className="overflow-hidden rounded-[1.25rem] border border-white/[0.08] shadow-[0_40px_100px_rgba(0,0,0,0.55)] sm:rounded-[28px]"
        style={{
          background: ambient
            ? `linear-gradient(165deg, rgba(${rgb}, 0.14) 0%, #111214 28%, #0e0f12 100%)`
            : "#111214",
          boxShadow: ambient
            ? `0 40px 100px rgba(0,0,0,0.55), 0 0 80px rgba(${rgb}, 0.12)`
            : undefined,
        }}
      >
        <div className="grid lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)]">
          <aside className="relative border-b border-white/[0.06] lg:border-b-0 lg:border-r lg:border-white/[0.06]">
            <div className="relative h-[120px] sm:h-[148px]">
              {live.banner_url ? (
                <SafeImage
                  src={live.banner_url}
                  alt=""
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 300px"
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

            <div className="relative px-3.5 pb-4 pt-0 sm:px-3.5 sm:pb-5">
              <div
                className="-mt-10 inline-flex rounded-full p-[4px] sm:-mt-11 sm:p-[5px]"
                style={{
                  background: "#111214",
                  boxShadow: ambient
                    ? `0 0 0 3px rgba(${rgb}, 0.55), 0 0 28px rgba(${rgb}, 0.35)`
                    : `0 0 0 3px ${accent}`,
                }}
              >
                <div className="relative h-[76px] w-[76px] overflow-hidden rounded-full bg-[#1e1f22] sm:h-[84px] sm:w-[84px]">
                  {live.avatar_url ? (
                    <SafeImage
                      src={live.avatar_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="84px"
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

              <div className="mt-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                    <h1 className="truncate text-[1.35rem] font-bold leading-tight tracking-[-0.03em] text-snow sm:text-[1.45rem]">
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
                    aria-label="Edit profile"
                    className={`pressable mt-0.5 min-h-11 shrink-0 rounded-full bg-white/[0.06] px-3.5 py-2 text-[0.8rem] font-medium text-[#dbdee1] ring-1 ring-white/[0.08] transition hover:bg-white/[0.1] hover:text-snow ${FOCUS_RING}`}
                  >
                    Edit
                  </button>
                ) : null}
              </div>

              <section className="mt-3 rounded-xl bg-[#1e1f22]/90 px-3 py-2.5 ring-1 ring-white/[0.04]">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#949ba4]">
                  About Me
                </p>
                {live.bio ? (
                  <p className="mt-1.5 whitespace-pre-wrap text-[0.875rem] leading-relaxed text-[#dbdee1]">
                    {live.bio}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[#6d6f78]">
                    {isOwner ? "Add a short bio from Edit." : "No bio yet."}
                  </p>
                )}
              </section>

              {isOwner && continueStrip.length > 0 ? (
                <section className="mt-2.5 rounded-xl bg-[#1e1f22]/90 px-3 py-2.5 ring-1 ring-white/[0.04]">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#949ba4]">
                      Continue watching
                    </p>
                    <button
                      type="button"
                      onClick={() => setTab("activity")}
                      aria-label="See all continue watching"
                      className={`min-h-8 rounded-md px-1.5 text-[0.65rem] font-medium text-[#949ba4] transition hover:text-[#dbdee1] ${FOCUS_RING}`}
                    >
                      See all
                    </button>
                  </div>
                  <div className="scrollbar-none -mx-0.5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-0.5 pb-0.5">
                    {continueStrip.map((item) => (
                      <Link
                        key={`${item.id}-${item.episode}-${item.language}`}
                        href={`/watch/${item.id}/${item.slug}?ep=${item.episode}&lang=${item.language}`}
                        aria-label={`Continue ${item.title}, episode ${item.episode}`}
                        className={`pressable group w-[4.75rem] shrink-0 snap-start sm:w-[4.5rem] ${FOCUS_RING} rounded-md`}
                        title={`${item.title} · Episode ${item.episode}`}
                      >
                        <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-[#111214] ring-1 ring-white/8 transition group-hover:ring-white/25">
                          {item.poster ? (
                            <SafeImage
                              src={item.poster}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="76px"
                            />
                          ) : null}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-1 pb-1 pt-5">
                            <p className="truncate text-center text-[0.55rem] font-semibold text-white/95">
                              E{item.episode}
                            </p>
                            {item.percent > 0 && item.percent < 100 ? (
                              <div className="mt-0.5 h-0.5 overflow-hidden rounded-full bg-white/20">
                                <div
                                  className="h-full rounded-full bg-white"
                                  style={{
                                    width: `${Math.min(100, item.percent)}%`,
                                  }}
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </aside>

          <div className="flex min-h-[300px] flex-col bg-[#0e0f12]/40 sm:min-h-[340px]">
            <div className="sticky top-14 z-20 border-b border-white/[0.06] bg-[#0e0f12]/92 backdrop-blur-xl sm:top-16 lg:static lg:bg-transparent lg:backdrop-blur-none">
              <div
                role="tablist"
                aria-label="Profile sections"
                className="scrollbar-none flex gap-0.5 overflow-x-auto px-3 py-2 sm:gap-1 sm:px-3.5 sm:pt-2.5 sm:pb-0"
              >
                {TABS.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      ref={(el) => {
                        tabRefs.current[t.id] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`profile-tab-${t.id}`}
                      aria-selected={active}
                      aria-controls={`profile-panel-${t.id}`}
                      tabIndex={active ? 0 : -1}
                      onClick={() => setTab(t.id)}
                      className={`pressable relative min-h-11 shrink-0 rounded-full px-3.5 py-2 text-[0.8125rem] font-medium transition sm:rounded-none sm:min-h-0 sm:px-3 sm:py-2.5 sm:text-sm ${FOCUS_RING} ${
                        active
                          ? "bg-white/[0.12] text-snow sm:bg-transparent"
                          : "text-[#949ba4] hover:text-[#dbdee1]"
                      }`}
                    >
                      {t.label}
                      {active ? (
                        <span
                          className="absolute inset-x-2.5 -bottom-px hidden h-0.5 rounded-full sm:block"
                          style={{ background: accent }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              key={tab}
              id={`profile-panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`profile-tab-${tab}`}
              className="flex-1 overflow-y-auto p-3.5 animate-rise"
              style={{ animationDuration: "0.28s" }}
            >
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
              {tab === "comments" ? (
                <CommentsTab
                  items={comments}
                  isOwner={isOwner}
                  accent={accent}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {editing && isOwner ? (
        <div className="mt-4 sm:mt-6">
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
    </>
  );

  return (
    <div className="page-shell relative pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-14 sm:pb-24 sm:pt-16 md:pt-20">
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

      <div className="relative w-full">
        {showQuitProfile ? (
          <div className="sticky top-14 z-30 mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-void/85 px-3.5 py-2.5 backdrop-blur-md sm:top-16 sm:px-4">
            <p className="min-w-0 truncate text-sm text-[#b5bac1]">
              Viewing{" "}
              <span className="font-medium text-snow">{name}</span>
            </p>
            <Link
              href="/profile"
              className={`pressable shrink-0 rounded-full bg-white/[0.08] px-3.5 py-2.5 text-[0.8125rem] font-medium text-snow transition hover:bg-white/[0.12] ${FOCUS_RING}`}
            >
              Quit profile
            </Link>
          </div>
        ) : null}

        {/*
          Desktop: [ Profile ] [ Find people + Discord (fills to profile bottom) ]
          then partners closer below.
          Mobile: Profile → Find people → Discord → Partners
        */}
        {showSocialRail ? (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-stretch lg:gap-5">
              <div className="order-1 min-w-0">{profileColumn}</div>
              <aside className="order-2 flex min-w-0 flex-col gap-4 lg:gap-5">
                <ProfileSearch compact excludeUserId={live.id} />
                <RailDiscordCta />
              </aside>
            </div>
            <div className="mt-5 sm:mt-6">
              <CommunityPartnersMarquee />
            </div>
          </>
        ) : (
          <div className="min-w-0">
            {profileColumn}
            <div className="mt-4">
              <ProfileSearch excludeUserId={live.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RailDiscordCta() {
  return (
    <a
      href={ANIKURA_DISCORD_INVITE}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join Anikura Discord for latest updates, feedback, and bugs"
      className={`group footer-discord-invite pressable relative flex w-full min-h-[11rem] flex-1 flex-col justify-between gap-5 overflow-hidden rounded-2xl px-4 py-4 sm:min-h-[12.5rem] sm:px-5 sm:py-5 ${FOCUS_RING}`}
    >
      <span
        aria-hidden
        className="footer-discord-glow pointer-events-none absolute inset-0"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_22%,rgba(255,255,255,0.14)_48%,transparent_72%)] opacity-0 transition duration-500 group-hover:translate-x-1 group-hover:opacity-100"
      />
      <span className="relative flex items-start gap-3.5">
        <span className="footer-discord-badge relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-black transition duration-300 group-hover:scale-[1.05]">
          <DiscordGlyph />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#57F287] ring-2 ring-black" />
        </span>
        <span className="min-w-0 flex-1 pt-0.5 leading-snug">
          <span className="block text-[0.95rem] font-semibold tracking-[-0.02em] text-white sm:text-base">
            Get the latest updates
          </span>
          <span className="mt-1.5 block text-[0.78rem] leading-relaxed text-white/65">
            Site news, feedback &amp; bugs — hang out on Discord instead of a
            feed here.
          </span>
        </span>
      </span>
      <span className="footer-discord-cta relative inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-[0.8125rem] font-semibold tracking-[-0.02em] transition duration-300 group-hover:-translate-y-0.5">
        Join Discord
        <span
          aria-hidden
          className="opacity-80 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
        >
          →
        </span>
      </span>
    </a>
  );
}

function DiscordGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
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
      <div className="mb-2.5">
        <h2 className="text-[0.95rem] font-semibold tracking-[-0.02em] text-snow">
          Profile board
        </h2>
        <p className="mt-0.5 text-[0.8125rem] text-[#949ba4]">
          {isOwner
            ? "Shelves from your list."
            : "Shelves from this viewer’s list."}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
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
      className="rounded-xl bg-[#1e1f22]/95 p-3 ring-1 ring-white/[0.05]"
      style={{
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(${rgb}, 0.04)`,
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#949ba4]">
          {widget.title}
        </p>
        <span className="text-[0.65rem] tabular-nums text-[#6d6f78]">
          {filled.length}/{widget.max}
        </span>
      </div>

      {empty ? (
        isOwner ? (
          <EmptySlot
            label={widget.addLabel}
            accent={accent}
            expanded
          />
        ) : (
          <p className="py-1 text-xs leading-snug text-[#6d6f78]">
            {widget.emptyHint}
          </p>
        )
      ) : (
        <div className="scrollbar-none -mx-0.5 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-0.5 pb-0.5">
          {filled.map((item) => (
            <Link
              key={item.id}
              href={`/anime/${item.anime_id}/${item.slug}`}
              aria-label={item.title}
              className={`pressable group relative aspect-[2/3] w-[4.25rem] shrink-0 snap-start overflow-hidden rounded-lg bg-[#111214] ring-1 ring-white/8 transition hover:ring-white/25 sm:w-[4.5rem] ${FOCUS_RING}`}
            >
              {item.poster ? (
                <SafeImage
                  src={item.poster}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  sizes="72px"
                />
              ) : null}
            </Link>
          ))}
          {showAdd ? (
            <EmptySlot label={widget.addLabel} accent={accent} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function EmptySlot({
  label,
  accent,
  expanded = false,
}: {
  label: string;
  accent: string;
  expanded?: boolean;
}) {
  if (expanded) {
    return (
      <Link
        href="/browse"
        aria-label={label}
        className={`group flex min-h-11 items-center gap-2.5 rounded-lg bg-white/[0.03] px-2.5 py-2 ring-1 ring-dashed ring-white/15 transition hover:bg-white/[0.06] hover:text-snow ${FOCUS_RING}`}
        style={{ borderColor: `${accent}33` }}
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/[0.04] text-lg text-[#949ba4] transition group-hover:text-snow group-hover:scale-105"
          style={{ color: accent }}
          aria-hidden
        >
          +
        </span>
        <span className="min-w-0 flex-1 text-left text-[0.8125rem] font-medium leading-snug text-[#dbdee1] transition group-hover:text-snow">
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/browse"
      aria-label={label}
      title={label}
      className={`grid aspect-[2/3] w-[4.25rem] shrink-0 place-items-center rounded-lg bg-white/[0.03] text-lg text-[#6d6f78] ring-1 ring-dashed ring-white/15 transition hover:bg-white/[0.06] hover:text-snow hover:scale-[1.02] sm:w-[4.5rem] ${FOCUS_RING}`}
      style={{ borderColor: `${accent}33`, transitionDuration: "0.2s" }}
    >
      <span aria-hidden>+</span>
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
      <h2 className="mb-1 text-[0.95rem] font-semibold tracking-[-0.02em] text-snow">
        Recently watched
      </h2>
      <p className="mb-3 text-[0.8125rem] text-[#949ba4]">
        Episodes you’ve been watching.
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={`${item.id}-${item.episode}-${item.language}-${item.updatedAt}`}>
            <Link
              href={`/watch/${item.id}/${item.slug}?ep=${item.episode}&lang=${item.language}`}
              aria-label={`Continue ${item.title}, episode ${item.episode}`}
              className={`pressable flex min-h-11 items-center gap-3 rounded-xl bg-[#1e1f22]/90 p-2 ring-1 ring-white/[0.04] transition hover:bg-[#232428] hover:ring-white/[0.08] ${FOCUS_RING}`}
            >
              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-[#111214]">
                {item.poster ? (
                  <SafeImage
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
                {item.percent > 0 && item.percent < 100 ? (
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10 sm:hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, item.percent)}%`,
                        background: accent,
                      }}
                    />
                  </div>
                ) : null}
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
      <h2 className="mb-1 text-[0.95rem] font-semibold tracking-[-0.02em] text-snow">
        Plan to watch
      </h2>
      <p className="mb-3 text-[0.8125rem] text-[#949ba4]">
        Series queued for later.
      </p>
      {items.length === 0 ? (
        <EmptyState
          title="Queue is empty"
          body={
            isOwner
              ? "Older Plan to watch entries appear here. Use Favourites, Watching, Completed, or On Hold from the heart menu."
              : "Nothing in this queue yet."
          }
          compact
          action={
            isOwner ? (
              <Link
                href="/browse"
                className={`mt-3 inline-flex min-h-11 items-center rounded-full bg-white/[0.08] px-4 text-sm font-medium text-snow transition hover:bg-white/[0.12] ${FOCUS_RING}`}
              >
                Browse titles
              </Link>
            ) : null
          }
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
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/anime/${item.anime_id}/${item.slug}`}
          aria-label={item.title}
          className={`group block rounded-xl ${FOCUS_RING}`}
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#1e1f22] ring-1 ring-white/8 transition duration-500 group-hover:-translate-y-0.5 group-hover:ring-white/25">
            {item.poster ? (
              <SafeImage
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
          <p className="mt-1.5 line-clamp-2 text-xs tracking-[-0.01em] text-[#dbdee1] transition group-hover:text-snow">
            {item.title}
          </p>
        </Link>
      ))}
    </div>
  );
}

function CommentsTab({
  items,
  isOwner,
  accent,
}: {
  items: ProfileCommentItem[];
  isOwner: boolean;
  accent: string;
}) {
  return (
    <div>
      <div className="mb-2.5">
        <h2 className="text-[0.95rem] font-semibold tracking-[-0.02em] text-snow">
          Comments
        </h2>
        <p className="mt-0.5 text-[0.8125rem] text-[#949ba4]">
          {isOwner
            ? "Your recent comments across series episodes."
            : "Recent comments across series episodes."}
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No comments yet"
          body={
            isOwner
              ? "Jump into an episode and leave a thought — it’ll show up here."
              : "This viewer hasn’t commented on any episodes yet."
          }
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const href = `/watch/${item.anime_id}/${item.animeSlug}?ep=${item.episode}&lang=${item.language}`;
            return (
              <li key={item.id}>
                <Link
                  href={href}
                  className={`pressable group flex gap-3 rounded-xl border border-white/[0.06] bg-[#1e1f22]/80 p-2.5 transition hover:border-white/15 hover:bg-white/[0.04] ${FOCUS_RING}`}
                >
                  <span className="relative h-[4.25rem] w-[3rem] shrink-0 overflow-hidden rounded-lg bg-[#111214] ring-1 ring-white/8">
                    {item.animePoster ? (
                      <SafeImage
                        src={item.animePoster}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.04]"
                        sizes="48px"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="truncate text-sm font-medium tracking-[-0.02em] text-snow">
                        {item.animeTitle}
                      </span>
                      <span
                        className="text-[0.7rem] font-medium uppercase tracking-[0.08em]"
                        style={{ color: accent }}
                      >
                        Ep {item.episode} · {item.language}
                      </span>
                    </span>
                    <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-[#dbdee1]">
                      {item.body}
                    </p>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.7rem] text-[#6d6f78]">
                      <span>{formatCommentTime(item.created_at)}</span>
                      {item.parent_id ? (
                        <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[0.65rem]">
                          Reply
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EmptyState({
  title,
  body,
  compact,
  action,
}: {
  title: string;
  body: string;
  compact?: boolean;
  action?: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center ${
        compact ? "px-4 py-8" : "px-6 py-12"
      }`}
    >
      <p className="text-sm font-medium text-[#dbdee1]">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-[#6d6f78]">{body}</p>
      {action}
    </div>
  );
}
