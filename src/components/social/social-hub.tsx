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
 * Community block — sits under Profile at matching column width.
 * Updates / Comments tabs with room to breathe (not rail-cramped).
 */
export function SocialHub({ announcements, comments }: Props) {
  const [tab, setTab] = useState<HubTab>("updates");
  const hasPinned = announcements.some((i) => i.pinned);

  return (
    <section className="min-w-0" aria-label="Community">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-mute">
            Community
          </p>
          <h2 className="mt-1 text-[0.95rem] font-semibold tracking-[-0.02em] text-snow sm:text-base">
            Updates &amp; recent comments
          </h2>
        </div>
        {hasPinned && tab === "updates" ? (
          <span className="rounded-full border border-sakura/25 bg-sakura/10 px-2.5 py-1 text-[0.58rem] font-medium uppercase tracking-[0.08em] text-sakura-soft">
            Pinned
          </span>
        ) : null}
      </div>

      <div
        role="tablist"
        aria-label="Community feed"
        className="flex gap-1 border-b border-white/[0.08]"
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
      </div>

      <div
        className="mt-1 max-h-[min(28rem,52vh)] overflow-y-auto overscroll-contain sm:max-h-[min(32rem,56vh)] lg:max-h-[min(36rem,calc(100vh-18rem))]"
        role="tabpanel"
        aria-label={tab === "updates" ? "Updates" : "Recent comments"}
      >
        {tab === "updates" ? (
          <AnnouncementsList items={announcements} />
        ) : (
          <RecentCommentsList items={comments} />
        )}
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
      className={`pressable relative min-h-11 shrink-0 rounded-t-lg px-3.5 py-2.5 text-[0.8125rem] font-medium transition sm:min-h-0 sm:py-2 ${FOCUS_RING} ${
        active ? "text-snow" : "text-[#949ba4] hover:text-[#dbdee1]"
      }`}
    >
      {label}
      <span
        className={`ml-1.5 text-[0.65rem] tabular-nums ${
          active ? "text-mute" : "text-[#6d6f78]"
        }`}
      >
        {count}
      </span>
      {active ? (
        <span className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-sakura/80" />
      ) : null}
    </button>
  );
}

function AnnouncementsList({ items }: { items: SocialAnnouncement[] }) {
  if (items.length === 0) {
    return (
      <div className="mx-0.5 my-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
        <p className="text-sm font-medium text-[#dbdee1]">No updates yet</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-[#6d6f78]">
          Site news and notes will show up here when the team posts.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/[0.05]">
      {items.map((item) => (
        <li key={item.id} className="px-0.5 py-3.5 first:pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {item.pinned ? (
              <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-mute">
                Pin
              </span>
            ) : null}
            <h3 className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-snow">
              {item.title}
            </h3>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#b5bac1]">
            {item.body}
          </p>
          <p className="mt-2 text-[0.7rem] text-mute">
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
      <div className="mx-0.5 my-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
        <p className="text-sm font-medium text-[#dbdee1]">No comments yet</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-[#6d6f78]">
          Finish an episode and leave the first note — it’ll land here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/[0.05]">
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
          <li key={item.id} className="px-0.5 py-3 first:pt-3">
            <div className="flex gap-3">
              <Link
                href={profileHref(author)}
                aria-label={`View ${name}'s profile`}
                className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/10 ${FOCUS_RING}`}
              >
                {item.authorAvatarUrl ? (
                  <SafeImage
                    src={item.authorAvatarUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-[0.7rem] font-semibold text-mute">
                    {name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <Link
                    href={profileHref(author)}
                    className={`truncate text-sm font-medium text-snow hover:underline ${FOCUS_RING} rounded-sm`}
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
                  className={`mt-1.5 block rounded-lg py-0.5 transition hover:bg-white/[0.03] ${FOCUS_RING}`}
                >
                  <span className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className="truncate text-[0.8125rem] font-medium text-[#dbdee1]">
                      {item.animeTitle}
                    </span>
                    <span className="text-[0.65rem] uppercase tracking-[0.06em] text-sakura-soft">
                      Ep {item.episode}
                    </span>
                  </span>
                  <span className="mt-1 line-clamp-3 text-sm leading-relaxed text-[#b5bac1]">
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
