"use client";

import { useState, useTransition } from "react";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from "@/app/admin/announcement-actions";
import type { SocialAnnouncement } from "@/lib/announcements";
import { formatCommentTime } from "@/lib/comments";

type Props = {
  initialItems: SocialAnnouncement[];
};

export function AnnouncementManager({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(true);
  const [published, setPublished] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refreshFromCreate(item: SocialAnnouncement) {
    setItems((prev) => [item, ...prev]);
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const created = await createAnnouncement({
          title,
          body,
          pinned,
          published,
        });
        refreshFromCreate({
          id: String(created.id),
          title: String(created.title),
          body: String(created.body),
          pinned: Boolean(created.pinned),
          published: Boolean(created.published),
          author_id: (created.author_id as string | null) ?? null,
          created_at: String(created.created_at),
          updated_at: String(created.updated_at),
          authorNickname: "You",
          authorUsername: null,
        });
        setTitle("");
        setBody("");
        setMessage("Announcement posted to Social.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post");
      }
    });
  }

  function togglePin(item: SocialAnnouncement) {
    setError(null);
    startTransition(async () => {
      try {
        await updateAnnouncement(item.id, { pinned: !item.pinned });
        setItems((prev) =>
          prev.map((x) =>
            x.id === item.id ? { ...x, pinned: !x.pinned } : x,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  function togglePublished(item: SocialAnnouncement) {
    setError(null);
    startTransition(async () => {
      try {
        await updateAnnouncement(item.id, { published: !item.published });
        setItems((prev) =>
          prev.map((x) =>
            x.id === item.id ? { ...x, published: !x.published } : x,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  function onDelete(item: SocialAnnouncement) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteAnnouncement(item.id);
        setItems((prev) => prev.filter((x) => x.id !== item.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="mb-4">
        <h2 className="text-lg tracking-[-0.02em] text-snow">
          Social announcements
        </h2>
        <p className="mt-1 text-sm text-mute">
          Pinned updates appear on the Social tab for every signed-in viewer.
        </p>
      </div>

      <form onSubmit={onCreate} className="space-y-3 rounded-xl border border-white/[0.06] bg-black/25 p-4">
        <label className="block">
          <span className="text-xs text-mute">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            placeholder="What’s new on Anikura"
            className="mt-1.5 w-full rounded-xl border border-white/[0.1] bg-black/35 px-3.5 py-2.5 text-sm text-snow outline-none transition placeholder:text-mute focus:border-white/25"
          />
        </label>
        <label className="block">
          <span className="text-xs text-mute">Body</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={4000}
            required
            rows={4}
            placeholder="Ship notes, schedule changes, community shout-outs…"
            className="mt-1.5 w-full resize-y rounded-xl border border-white/[0.1] bg-black/35 px-3.5 py-2.5 text-sm text-snow outline-none transition placeholder:text-mute focus:border-white/25"
          />
        </label>
        <div className="flex flex-wrap items-center gap-4 text-sm text-cloud">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="rounded border-white/20"
            />
            Pin to top
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="rounded border-white/20"
            />
            Published
          </label>
          <button
            type="submit"
            disabled={pending || !title.trim() || !body.trim()}
            className="ml-auto rounded-full bg-snow px-4 py-2 text-sm font-medium text-void transition hover:bg-white disabled:opacity-50"
          >
            {pending ? "Posting…" : "Post update"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-[#ff6b6b]" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm text-sakura-soft">{message}</p>
      ) : null}

      <ul className="mt-5 space-y-2.5">
        {items.length === 0 ? (
          <li className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-mute">
            No announcements yet
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.pinned ? (
                      <span className="rounded-md border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-cloud">
                        Pin
                      </span>
                    ) : null}
                    {!item.published ? (
                      <span className="rounded-md border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-amber-100/90">
                        Draft
                      </span>
                    ) : null}
                    <p className="truncate text-sm font-medium text-snow">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-1.5 line-clamp-3 text-sm text-cloud">
                    {item.body}
                  </p>
                  <p className="mt-2 text-[0.7rem] text-mute">
                    {formatCommentTime(item.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => togglePin(item)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-cloud transition hover:border-white/25 hover:text-snow disabled:opacity-50"
                  >
                    {item.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => togglePublished(item)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-cloud transition hover:border-white/25 hover:text-snow disabled:opacity-50"
                  >
                    {item.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onDelete(item)}
                    className="rounded-full border border-red-400/20 px-3 py-1.5 text-xs text-red-300/90 transition hover:border-red-400/40 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
