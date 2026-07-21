"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ProfilePeekCard } from "@/components/profile/profile-peek-card";
import { SectionHeading } from "@/components/section-heading";
import {
  COMMENT_MAX_LENGTH,
  COMMENT_SELECT,
  formatCommentTime,
  validateCommentBody,
  type AnimeComment,
} from "@/lib/comments";
import { displayName } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = {
  animeId: number;
  returnPath: string;
};

type ComposerProfile = {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  email: string | null;
};

function normalizeComment(row: Record<string, unknown>): AnimeComment {
  const authorRaw = row.author;
  const author =
    authorRaw && typeof authorRaw === "object" && !Array.isArray(authorRaw)
      ? (authorRaw as AnimeComment["author"])
      : Array.isArray(authorRaw) && authorRaw[0]
        ? (authorRaw[0] as AnimeComment["author"])
        : null;

  return {
    id: String(row.id),
    anime_id: Number(row.anime_id),
    user_id: String(row.user_id),
    body: String(row.body ?? ""),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    author,
  };
}

function AuthorAvatar({
  name,
  avatarUrl,
  size = 40,
}: {
  name: string;
  avatarUrl: string | null | undefined;
  size?: number;
}) {
  const initial = name.slice(0, 1).toUpperCase() || "?";
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-[#1e1f22] ring-1 ring-white/10"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-xs font-semibold text-[#b5bac1]">
          {initial}
        </div>
      )}
    </div>
  );
}

function AuthorHoverName({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => {
        clearClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onFocus={() => {
        clearClose();
        setOpen(true);
      }}
      onBlur={scheduleClose}
    >
      <Link
        href={`/u/${userId}`}
        className="font-semibold text-[#f2f3f5] transition hover:underline"
      >
        {name}
      </Link>
      {open ? (
        <span
          className="absolute left-0 top-full z-30 pt-2"
          onMouseEnter={clearClose}
          onMouseLeave={scheduleClose}
        >
          <ProfilePeekCard userId={userId} />
        </span>
      ) : null}
    </span>
  );
}

export function AnimeComments({ animeId, returnPath }: Props) {
  const formId = useId();
  const [comments, setComments] = useState<AnimeComment[]>([]);
  const [me, setMe] = useState<ComposerProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;
  const signupHref = `/login?mode=signup&next=${encodeURIComponent(returnPath)}`;

  const loadComments = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      setError("Comments are unavailable until auth is configured.");
      return;
    }

    const supabase = createClient();
    const { data, error: queryError } = await supabase
      .from("anime_comments")
      .select(COMMENT_SELECT)
      .eq("anime_id", animeId)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message || "Couldn’t load comments.");
      setComments([]);
    } else {
      setError(null);
      setComments((data ?? []).map((row) => normalizeComment(row as Record<string, unknown>)));
    }
    setLoading(false);
  }, [animeId, configured]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadComments();
      if (!configured || cancelled) return;

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setMe(null);
        setIsAdmin(false);
        return;
      }

      const [{ data: profile }, { data: adminFlag }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, nickname, avatar_url, email, role")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.rpc("is_admin"),
      ]);

      if (cancelled) return;

      setMe({
        id: user.id,
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        email: profile?.email ?? user.email ?? null,
      });
      setIsAdmin(adminFlag === true);
    })();

    return () => {
      cancelled = true;
    };
  }, [configured, loadComments]);

  async function handlePost(e: FormEvent) {
    e.preventDefault();
    if (!me || posting) return;

    const validation = validateCommentBody(body);
    if (validation) {
      setFormError(validation);
      return;
    }

    setPosting(true);
    setFormError(null);

    const supabase = createClient();
    const trimmed = body.trim();
    const { error: insertError } = await supabase.from("anime_comments").insert({
      anime_id: animeId,
      user_id: me.id,
      body: trimmed,
    });

    if (insertError) {
      setFormError(insertError.message || "Couldn’t post comment.");
      setPosting(false);
      return;
    }

    setBody("");
    setPosting(false);
    setLoading(true);
    await loadComments();
  }

  async function handleDelete(commentId: string) {
    if (deletingId) return;
    setDeletingId(commentId);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("anime_comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      setError(deleteError.message || "Couldn’t delete comment.");
      setDeletingId(null);
      return;
    }

    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setDeletingId(null);
  }

  const count = comments.length;
  const remaining = COMMENT_MAX_LENGTH - body.length;

  return (
    <section className="mt-16 animate-rise">
      <SectionHeading
        title="Comments"
        subtitle={
          count > 0
            ? `${count} ${count === 1 ? "voice" : "voices"} on this series — newest first.`
            : "Share a take, a spoiler warning, or a quiet recommendation."
        }
      />

      <div className="panel-soft mt-6 overflow-hidden">
        <div className="border-b border-white/[0.06] bg-[#0c0d10]/60 px-5 py-5 sm:px-6">
          {!configured ? (
            <p className="text-sm text-mute">Comments aren’t available right now.</p>
          ) : me ? (
            <form onSubmit={handlePost} className="flex gap-3">
              <AuthorAvatar
                name={displayName(me)}
                avatarUrl={me.avatar_url}
                size={40}
              />
              <div className="min-w-0 flex-1">
                <label htmlFor={`${formId}-body`} className="sr-only">
                  Write a comment
                </label>
                <textarea
                  id={`${formId}-body`}
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value.slice(0, COMMENT_MAX_LENGTH));
                    if (formError) setFormError(null);
                  }}
                  rows={3}
                  maxLength={COMMENT_MAX_LENGTH}
                  placeholder="Add to the conversation…"
                  className="w-full resize-y rounded-xl border border-white/[0.08] bg-[#111214] px-3.5 py-3 text-sm leading-relaxed text-[#dbdee1] placeholder:text-[#6d6f78] outline-none transition focus:border-white/20 focus:ring-1 focus:ring-white/10"
                />
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <p
                    className={`text-[0.7rem] tabular-nums ${
                      remaining < 80 ? "text-[#f0b232]" : "text-[#6d6f78]"
                    }`}
                  >
                    {remaining} left
                  </p>
                  <button
                    type="submit"
                    disabled={posting || !body.trim()}
                    className="rounded-lg bg-[#5865f2] px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {posting ? "Posting…" : "Post"}
                  </button>
                </div>
                {formError ? (
                  <p className="mt-2 text-sm text-[#f23f43]" role="alert">
                    {formError}
                  </p>
                ) : null}
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[#f2f3f5]">
                  Sign in to join the conversation
                </p>
                <p className="mt-1 text-sm text-[#949ba4]">
                  You can read every comment — posting needs an account.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={loginHref}
                  className="rounded-lg border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-[#dbdee1] transition hover:border-white/20 hover:bg-white/[0.07] hover:text-snow"
                >
                  Sign in
                </Link>
                <Link
                  href={signupHref}
                  className="rounded-lg bg-[#5865f2] px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-[#4752c4]"
                >
                  Create account
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-2 sm:px-6">
          {loading ? (
            <ul className="divide-y divide-white/[0.05]" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex gap-3 py-5">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-white/[0.06]" />
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="h-3 w-28 animate-pulse rounded bg-white/[0.06]" />
                    <div className="h-3 w-full max-w-md animate-pulse rounded bg-white/[0.05]" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.04]" />
                  </div>
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[#f23f43]">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  void loadComments();
                }}
                className="mt-3 text-sm text-[#949ba4] underline-offset-2 transition hover:text-snow hover:underline"
              >
                Try again
              </button>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-[#dbdee1]">No comments yet</p>
              <p className="mt-1.5 text-sm text-[#6d6f78]">
                Be the first to leave a note on this series.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {comments.map((comment) => {
                const name = displayName(
                  comment.author ?? {
                    nickname: null,
                    email: null,
                  },
                );
                const canDelete =
                  me &&
                  (me.id === comment.user_id || isAdmin);

                return (
                  <li key={comment.id} className="group flex gap-3 py-5">
                    <Link href={`/u/${comment.user_id}`} className="shrink-0">
                      <AuthorAvatar
                        name={name}
                        avatarUrl={comment.author?.avatar_url}
                        size={40}
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <AuthorHoverName userId={comment.user_id} name={name} />
                        <time
                          dateTime={comment.created_at}
                          className="text-[0.7rem] text-[#6d6f78]"
                        >
                          {formatCommentTime(comment.created_at)}
                        </time>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#dbdee1]">
                        {comment.body}
                      </p>
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => void handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          className="mt-2 text-[0.7rem] font-medium text-[#6d6f78] transition hover:text-[#f23f43] disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                        >
                          {deletingId === comment.id ? "Deleting…" : "Delete"}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
