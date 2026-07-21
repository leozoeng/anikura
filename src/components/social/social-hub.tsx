import Image from "next/image";
import Link from "next/link";
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

export function SocialHub({ announcements, comments }: Props) {
  return (
    <div className="space-y-4">
      <AnnouncementsSection items={announcements} />
      <RecentCommentsSection items={comments} />
    </div>
  );
}

function AnnouncementsSection({ items }: { items: SocialAnnouncement[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      <div className="flex items-end justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-mute">
            From the desk
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-snow sm:text-lg">
            Updates &amp; announcements
          </h2>
        </div>
        {items.some((i) => i.pinned) ? (
          <span className="shrink-0 rounded-full border border-sakura/25 bg-sakura/10 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-sakura-soft">
            Pinned
          </span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-mute sm:px-5">
          No announcements yet — check back when the team posts an update.
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {items.map((item) => (
            <li key={item.id} className="px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                {item.pinned ? (
                  <span className="rounded-md border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-cloud">
                    Pin
                  </span>
                ) : null}
                <h3 className="text-[0.95rem] font-semibold tracking-[-0.02em] text-snow">
                  {item.title}
                </h3>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#dbdee1]">
                {item.body}
              </p>
              <p className="mt-2.5 text-[0.7rem] text-mute">
                {item.authorNickname || item.authorUsername
                  ? `${item.authorNickname || `@${item.authorUsername}`} · `
                  : ""}
                {formatCommentTime(item.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentCommentsSection({ items }: { items: SiteCommentItem[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      <div className="border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-mute">
          Across Anikura
        </p>
        <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-snow sm:text-lg">
          Recent comments
        </h2>
        <p className="mt-0.5 text-sm text-mute">
          Latest thoughts on episodes and series
        </p>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-mute sm:px-5">
          No comments yet — finish an episode and leave the first note.
        </p>
      ) : (
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
                <div className="flex gap-3 px-4 py-3.5 sm:px-5">
                  <Link
                    href={profileHref(author)}
                    className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/10"
                  >
                    {item.authorAvatarUrl ? (
                      <Image
                        src={item.authorAvatarUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-xs font-semibold text-mute">
                        {name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <Link
                        href={profileHref(author)}
                        className="truncate text-sm font-medium text-snow hover:underline"
                      >
                        {name}
                      </Link>
                      <span className="truncate text-xs text-mute">{handle}</span>
                      <span className="text-xs text-mute">
                        · {formatCommentTime(item.created_at)}
                      </span>
                    </div>

                    <Link
                      href={watchHref}
                      className="mt-1.5 block rounded-xl border border-white/[0.06] bg-black/25 p-2.5 transition hover:border-white/15 hover:bg-white/[0.04]"
                    >
                      <span className="flex gap-2.5">
                        <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-[#111214] ring-1 ring-white/8">
                          {item.animePoster ? (
                            <Image
                              src={item.animePoster}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <span className="truncate text-sm font-medium text-snow">
                              {item.animeTitle}
                            </span>
                            <span className="text-[0.7rem] uppercase tracking-[0.06em] text-sakura-soft">
                              Ep {item.episode} · {item.language}
                            </span>
                          </span>
                          <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#dbdee1]">
                            {item.body}
                          </span>
                          {item.parent_id ? (
                            <span className="mt-1 inline-block rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[0.65rem] text-mute">
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
      )}
    </section>
  );
}
