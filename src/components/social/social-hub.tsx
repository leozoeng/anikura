"use client";

import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { useState } from "react";
import type { SocialAnnouncement } from "@/lib/announcements";
import {
  formatCommentTime,
  type SiteCommentItem,
} from "@/lib/comments";
import { displayName, profileHref } from "@/lib/profile";

type Props = {
  announcements: SocialAnnouncement[];
  comments: SiteCommentItem[];
};

type HubTab = "updates" | "comments";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30";

/**
 * Secondary community block for the Social rail.
 * Kept flat / less card-heavy so Find people stays the primary discovery job.
 */
export function SocialHub({ announcements, comments }: Props) {
  const [tab, setTab] = useState<HubTab>("updates");
  const [open, setOpen] = useState(false);
  const hasPinned = announcements.some((i) => i.pinned);
  const previewCount =
    tab === "updates" ? announcements.length : comments.length;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-transparent">
      <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-0.5 lg:px-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-mute">
          Community
        </p>
        <button
          type="button"
          className={`lg:hidden min-h-11 rounded-lg px-2.5 text-[0.75rem] font-medium text-[#949ba4] transition hover:text-snow ${FOCUS_RING}`}
          aria-expanded={open}
          aria-controls="social-hub-panel"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide" : `Show · ${previewCount}`}
        </button>
      </div>

      <div
        id="social-hub-panel"
        className={`${open ? "block" : "hidden"} lg:block`}
      >
        <div
          role="tablist"
          aria-label="Community feed"
          className="flex gap-0.5 border-b border-white/[0.06] px-0.5"
        >
          <HubTabButton
            active={tab === "updates"}
            onClick={() => setTab("updates")}
            label="Updates"
            count={announcements.length}
          />
          <HubTabButton
            active={tab === "comments"}
            onClick={() => setTab("comments")}
            label="Comments"
            count={comments.length}
          />
          {hasPinned && tab === "updates" ? (
            <span className="ml-auto self-center rounded-full border border-sakura/25 bg-sakura/10 px-2 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.08em] text-sakura-soft">
              Pinned
            </span>
          ) : null}
        </div>

        <div
          className="max-h-[min(14rem,36vh)] overflow-y-auto overscroll-contain lg:max-h-[min(22rem,calc(100vh-16rem))]"
          role="tabpanel"
          aria-label={tab === "updates" ? "Updates" : "Recent comments"}
        >
          {tab === "updates" ? (
            <AnnouncementsList items={announcements} />
          ) : (
            <RecentCommentsList items={comments} />
          )}
        </div>
      </div>
    </section>
  );
}

function HubTabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`pressable relative min-h-11 shrink-0 rounded-t-lg px-3 py-2 text-[0.8125rem] font-medium transition lg:min-h-0 ${FOCUS_RING} ${
        active
          ? "text-snow"
          : "text-[#949ba4] hover:text-[#dbdee1]"
      }`}
    >
      {label}
      {count > 0 ? (
        <span
          className={`ml-1.5 text-[0.65rem] tabular-nums ${
            active ? "text-mute" : "text-[#6d6f78]"
          }`}
        >
          {count}
        </span>
      ) : null}
      {active ? (
        <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-sakura/80" />
      ) : null}
    </button>
  );
}

function AnnouncementsList({ items }: { items: SocialAnnouncement[] }) {
  if (items.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-mute">
        No announcements yet — check back when the team posts an update.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-white/[0.04]">
      {items.map((item) => (
        <li key={item.id} className="px-1 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {item.pinned ? (
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-mute">
                Pin
              </span>
            ) : null}
            <h3 className="text-sm font-semibold tracking-[-0.02em] text-snow">
              {item.title}
            </h3>
          </div>
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-[#b5bac1]">
            {item.body}
          </p>
          <p className="mt-1.5 text-[0.65rem] text-mute">
            {item.authorNickname || item.authorUsername
              ? `${item.authorNickname || `@${item.authorUsername}`} · `
              : ""}
            {formatCommentTime(item.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function RecentCommentsList({ items }: { items: SiteCommentItem[] }) {
  if (items.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-mute">
        No comments yet — finish an episode and leave the first note.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-white/[0.04]">
      {items.map((item) => {
        const author = {
          id: item.user_id,
          username: item.authorUsername,
          nickname: item.authorNickname,
          email: null,
        };
        const name = displayName(author);
        const handle = item.authorUsername
          ? `@${item.authorUsername}`
          : name;
        const watchHref = `/watch/${item.anime_id}/${item.animeSlug}?ep=${item.episode}&lang=${item.language}`;

        return (
          <li key={item.id} className="px-1 py-2.5">
            <div className="flex gap-2.5">
              <Link
                href={profileHref(author)}
                aria-label={`View ${name}'s profile`}
                className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/10 ${FOCUS_RING}`}
              >
                {item.authorAvatarUrl ? (
                  <SafeImage
                    src={item.authorAvatarUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-[0.65rem] font-semibold text-mute">
                    {name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <Link
                    href={profileHref(author)}
                    className={`truncate text-[0.8125rem] font-medium text-snow hover:underline ${FOCUS_RING} rounded-sm`}
                  >
                    {name}
                  </Link>
                  <span className="truncate text-[0.7rem] text-mute">
                    {handle}
                  </span>
                  <span className="text-[0.7rem] text-mute">
                    · {formatCommentTime(item.created_at)}
                  </span>
                </div>

                <Link
                  href={watchHref}
                  className={`mt-1 block rounded-lg py-0.5 transition hover:bg-white/[0.03] ${FOCUS_RING}`}
                >
                  <span className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className="truncate text-[0.75rem] font-medium text-[#dbdee1]">
                      {item.animeTitle}
                    </span>
                    <span className="text-[0.6rem] uppercase tracking-[0.06em] text-sakura-soft">
                      Ep {item.episode}
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[0.8125rem] leading-relaxed text-[#b5bac1]">
                    {item.body}
                  </span>
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
