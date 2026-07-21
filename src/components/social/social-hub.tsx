"use client";

import Image from "next/image";
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

export function SocialHub({ announcements, comments }: Props) {
  const [tab, setTab] = useState<HubTab>("updates");
  const hasPinned = announcements.some((i) => i.pinned);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      <div className="border-b border-white/[0.06] px-3.5 pt-3 sm:px-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-mute">
          Community
        </p>
        <div
          role="tablist"
          aria-label="Community feed"
          className="mt-2 flex gap-0.5"
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
      </div>

      <div
        className="max-h-[min(22rem,42vh)] overflow-y-auto overscroll-contain lg:max-h-[min(28rem,calc(100vh-11rem))]"
        role="tabpanel"
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
      className={`pressable relative shrink-0 rounded-t-lg px-3 py-2 text-[0.8125rem] font-medium transition ${
        active
          ? "bg-white/[0.08] text-snow"
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
      <p className="px-3.5 py-8 text-center text-sm text-mute sm:px-4">
        No announcements yet — check back when the team posts an update.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-white/[0.05]">
      {items.map((item) => (
        <li key={item.id} className="px-3.5 py-3.5 sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            {item.pinned ? (
              <span className="rounded-md border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-cloud">
                Pin
              </span>
            ) : null}
            <h3 className="text-sm font-semibold tracking-[-0.02em] text-snow">
              {item.title}
            </h3>
          </div>
          <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-[#dbdee1]">
            {item.body}
          </p>
          <p className="mt-2 text-[0.65rem] text-mute">
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
      <p className="px-3.5 py-8 text-center text-sm text-mute sm:px-4">
        No comments yet — finish an episode and leave the first note.
      </p>
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
          <li key={item.id}>
            <div className="flex gap-2.5 px-3.5 py-3 sm:px-4">
              <Link
                href={profileHref(author)}
                className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/10"
              >
                {item.authorAvatarUrl ? (
                  <Image
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
                    className="truncate text-[0.8125rem] font-medium text-snow hover:underline"
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
                  className="mt-1.5 block rounded-xl border border-white/[0.06] bg-black/25 p-2 transition hover:border-white/15 hover:bg-white/[0.04]"
                >
                  <span className="flex gap-2">
                    <span className="relative h-12 w-8 shrink-0 overflow-hidden rounded-md bg-[#111214] ring-1 ring-white/8">
                      {item.animePoster ? (
                        <Image
                          src={item.animePoster}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="truncate text-[0.8125rem] font-medium text-snow">
                          {item.animeTitle}
                        </span>
                        <span className="text-[0.65rem] uppercase tracking-[0.06em] text-sakura-soft">
                          Ep {item.episode} · {item.language}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-[0.8125rem] leading-relaxed text-[#dbdee1]">
                        {item.body}
                      </span>
                      {item.parent_id ? (
                        <span className="mt-1 inline-block rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[0.6rem] text-mute">
                          Reply
                        </span>
                      ) : null}
                    </span>
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
