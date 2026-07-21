"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { ProfilePeekCard } from "@/components/profile/profile-peek-card";
import {
  COMMENT_MAX_LENGTH,
  COMMENT_SELECT,
  formatCommentTime,
  formatLikeCount,
  sortComments,
  validateCommentBody,
  type AnimeComment,
  type CommentLanguage,
  type CommentSort,
} from "@/lib/comments";
import { displayName, handleFromProfile, profileHref } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = {
  animeId: number;
  episode: number;
  language: CommentLanguage;
  returnPath: string;
  className?: string;
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

  const language =
    row.language === "dub" || row.language === "sub" ? row.language : "sub";

  return {
    id: String(row.id),
    anime_id: Number(row.anime_id),
    episode: Number(row.episode),
    language,
    user_id: String(row.user_id),
    body: String(row.body ?? ""),
    parent_id: row.parent_id ? String(row.parent_id) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    author,
    like_count: 0,
    liked_by_me: false,
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
      className="relative shrink-0 overflow-hidden rounded-full bg-[#272727]"
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
        <div className="grid h-full w-full place-items-center text-xs font-semibold text-[#aaa]">
          {initial}
        </div>
      )}
    </div>
  );
}

const PEEK_CARD_WIDTH = 288;

function AuthorHoverName({
  userId,
  username,
  handle,
}: {
  userId: string;
  username?: string | null;
  handle: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const href = profileHref({ id: userId, username });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }

    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      let left = rect.left;
      left = Math.max(
        8,
        Math.min(left, window.innerWidth - PEEK_CARD_WIDTH - 8),
      );
      setPos({ top: rect.bottom, left });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

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

  const peek =
    open && mounted
      ? createPortal(
          <div
            className="fixed z-[220] pt-2"
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              visibility: pos ? "visible" : "hidden",
            }}
            onMouseEnter={clearClose}
            onMouseLeave={scheduleClose}
          >
            <ProfilePeekCard userId={userId} />
          </div>,
          document.body,
        )
      : null;

  return (
    <span
      ref={triggerRef}
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
        href={href}
        className="text-sm font-medium text-[#f1f1f1] transition hover:text-white"
      >
        {handle}
      </Link>
      {peek}
    </span>
  );
}

function ThumbUpIcon({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path
        fill="currentColor"
        d={
          filled
            ? "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"
            : "M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.58 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12.23 10H20v2l-3 7H9V9zM1 9h4v12H1z"
        }
      />
    </svg>
  );
}

function ThumbDownIcon({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path
        fill="currentColor"
        d={
          filled
            ? "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"
            : "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.58-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm0 12-4.34 4.34.11-5.34H4v-2l3-7h8v10zm4-12h4v12h-4z"
        }
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M21 6H3V5h18v1zm-6 5H3v1h12v-1zm-6 6H3v1h6v-1z"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M12 16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm0-6c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm0-6c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </svg>
  );
}

export function AnimeComments({
  animeId,
  episode,
  language,
  returnPath,
  className = "",
}: Props) {
  const formId = useId();
  const [comments, setComments] = useState<AnimeComment[]>([]);
  const [me, setMe] = useState<ComposerProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sort, setSort] = useState<CommentSort>("top");
  const [sortOpen, setSortOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    () => new Set(),
  );
  const [disliked, setDisliked] = useState<Set<string>>(() => new Set());
  const configured = isSupabaseConfigured();
  const sortRef = useRef<HTMLDivElement>(null);

  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;
  const signupHref = `/login?mode=signup&next=${encodeURIComponent(returnPath)}`;

  const loadComments = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      setError("Comments are unavailable until auth is configured.");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: queryError } = await supabase
      .from("anime_comments")
      .select(COMMENT_SELECT)
      .eq("anime_id", animeId)
      .eq("episode", episode)
      .eq("language", language)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message || "Couldn’t load comments.");
      setComments([]);
      setLoading(false);
      return;
    }

    const rows = (data ?? []).map((row) =>
      normalizeComment(row as Record<string, unknown>),
    );
    const ids = rows.map((r) => r.id);

    let likeCounts = new Map<string, number>();
    let likedMine = new Set<string>();

    if (ids.length) {
      const { data: likes } = await supabase
        .from("anime_comment_likes")
        .select("comment_id, user_id")
        .in("comment_id", ids);

      likeCounts = new Map();
      for (const row of likes ?? []) {
        const cid = String(row.comment_id);
        likeCounts.set(cid, (likeCounts.get(cid) ?? 0) + 1);
        if (user && row.user_id === user.id) likedMine.add(cid);
      }
    }

    setError(null);
    setComments(
      rows.map((c) => ({
        ...c,
        like_count: likeCounts.get(c.id) ?? 0,
        liked_by_me: likedMine.has(c.id),
      })),
    );
    setLoading(false);
  }, [animeId, episode, language, configured]);

  useEffect(() => {
    let cancelled = false;

    setComments([]);
    setLoading(true);
    setError(null);
    setBody("");
    setFormError(null);
    setReplyTo(null);
    setComposerOpen(false);

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

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const roots = useMemo(() => {
    const tops = comments.filter((c) => !c.parent_id);
    return sortComments(tops, sort);
  }, [comments, sort]);

  const repliesByParent = useMemo(() => {
    const map = new Map<string, AnimeComment[]>();
    for (const c of comments) {
      if (!c.parent_id) continue;
      const list = map.get(c.parent_id) ?? [];
      list.push(c);
      map.set(c.parent_id, list);
    }
    for (const [id, list] of map) {
      map.set(
        id,
        [...list].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
      );
    }
    return map;
  }, [comments]);

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
    const { error: insertError } = await supabase.from("anime_comments").insert({
      anime_id: animeId,
      episode,
      language,
      user_id: me.id,
      body: body.trim(),
      parent_id: null,
    });

    if (insertError) {
      setFormError(insertError.message || "Couldn’t post comment.");
      setPosting(false);
      return;
    }

    setBody("");
    setComposerOpen(false);
    setPosting(false);
    setLoading(true);
    await loadComments();
  }

  async function handleReply(parentId: string) {
    if (!me || posting) return;
    const validation = validateCommentBody(replyBody);
    if (validation) {
      setReplyError(validation);
      return;
    }

    setPosting(true);
    setReplyError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("anime_comments").insert({
      anime_id: animeId,
      episode,
      language,
      user_id: me.id,
      body: replyBody.trim(),
      parent_id: parentId,
    });

    if (insertError) {
      setReplyError(insertError.message || "Couldn’t post reply.");
      setPosting(false);
      return;
    }

    setReplyBody("");
    setReplyTo(null);
    setPosting(false);
    setExpandedReplies((prev) => new Set(prev).add(parentId));
    setLoading(true);
    await loadComments();
  }

  async function handleDelete(commentId: string) {
    if (deletingId) return;
    setDeletingId(commentId);
    setMenuOpenId(null);
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

    setComments((prev) =>
      prev.filter((c) => c.id !== commentId && c.parent_id !== commentId),
    );
    setDeletingId(null);
  }

  async function toggleLike(comment: AnimeComment) {
    if (!me) {
      window.location.href = loginHref;
      return;
    }

    const supabase = createClient();
    const nextLiked = !comment.liked_by_me;

    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id
          ? {
              ...c,
              liked_by_me: nextLiked,
              like_count: Math.max(0, c.like_count + (nextLiked ? 1 : -1)),
            }
          : c,
      ),
    );
    setDisliked((prev) => {
      const next = new Set(prev);
      next.delete(comment.id);
      return next;
    });

    if (nextLiked) {
      const { error: likeError } = await supabase
        .from("anime_comment_likes")
        .insert({ comment_id: comment.id, user_id: me.id });
      if (likeError) await loadComments();
    } else {
      const { error: unlikeError } = await supabase
        .from("anime_comment_likes")
        .delete()
        .eq("comment_id", comment.id)
        .eq("user_id", me.id);
      if (unlikeError) await loadComments();
    }
  }

  async function toggleDislike(comment: AnimeComment) {
    if (!me) {
      window.location.href = loginHref;
      return;
    }

    const willDislike = !disliked.has(comment.id);
    setDisliked((prev) => {
      const next = new Set(prev);
      if (willDislike) next.add(comment.id);
      else next.delete(comment.id);
      return next;
    });

    if (willDislike && comment.liked_by_me) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? {
                ...c,
                liked_by_me: false,
                like_count: Math.max(0, c.like_count - 1),
              }
            : c,
        ),
      );
      const supabase = createClient();
      const { error: unlikeError } = await supabase
        .from("anime_comment_likes")
        .delete()
        .eq("comment_id", comment.id)
        .eq("user_id", me.id);
      if (unlikeError) await loadComments();
    }
  }

  function renderComment(comment: AnimeComment, isReply = false) {
    const name = displayName(
      comment.author ?? { nickname: null, email: null },
    );
    const handle = handleFromProfile(
      comment.author ?? { nickname: null, email: null },
    );
    const authorHref = profileHref({
      id: comment.user_id,
      username: comment.author?.username,
    });
    const canDelete = me && (me.id === comment.user_id || isAdmin);
    const replies = repliesByParent.get(comment.id) ?? [];
    const repliesOpen = expandedReplies.has(comment.id);
    const likeLabel = formatLikeCount(comment.like_count);

    return (
      <li key={comment.id} className="group relative">
        <div className={`flex gap-3 ${isReply ? "" : "py-3"}`}>
          <Link href={authorHref} className="shrink-0 self-start">
            <AuthorAvatar
              name={name}
              avatarUrl={comment.author?.avatar_url}
              size={isReply ? 24 : 40}
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
                <AuthorHoverName
                  userId={comment.user_id}
                  username={comment.author?.username}
                  handle={handle}
                />
                <time
                  dateTime={comment.created_at}
                  className="text-xs text-[#aaa]"
                >
                  {formatCommentTime(comment.created_at)}
                </time>
              </div>

              {canDelete ? (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    aria-label="More actions"
                    onClick={() =>
                      setMenuOpenId((id) =>
                        id === comment.id ? null : comment.id,
                      )
                    }
                    className="rounded-full p-1.5 text-[#aaa] opacity-0 transition hover:bg-white/10 group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <MoreIcon />
                  </button>
                  {menuOpenId === comment.id ? (
                    <div className="absolute right-0 top-8 z-20 min-w-[120px] overflow-hidden rounded-xl bg-[#282828] py-1 shadow-xl ring-1 ring-white/10">
                      <button
                        type="button"
                        onClick={() => void handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="block w-full px-4 py-2.5 text-left text-sm text-[#f1f1f1] transition hover:bg-white/10 disabled:opacity-50"
                      >
                        {deletingId === comment.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-[#f1f1f1]">
              {comment.body}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-1">
              <button
                type="button"
                aria-label="Like"
                aria-pressed={comment.liked_by_me}
                onClick={() => void toggleLike(comment)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs transition hover:bg-white/10 ${
                  comment.liked_by_me ? "text-[#3ea6ff]" : "text-[#aaa]"
                }`}
              >
                <ThumbUpIcon filled={comment.liked_by_me} />
                {likeLabel ? <span>{likeLabel}</span> : null}
              </button>
              <button
                type="button"
                aria-label="Dislike"
                aria-pressed={disliked.has(comment.id)}
                onClick={() => void toggleDislike(comment)}
                className={`rounded-full p-1.5 transition hover:bg-white/10 ${
                  disliked.has(comment.id) ? "text-[#3ea6ff]" : "text-[#aaa]"
                }`}
              >
                <ThumbDownIcon filled={disliked.has(comment.id)} />
              </button>
              {!isReply ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!me) {
                      window.location.href = loginHref;
                      return;
                    }
                    setReplyTo((id) =>
                      id === comment.id ? null : comment.id,
                    );
                    setReplyBody("");
                    setReplyError(null);
                  }}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-[#f1f1f1] transition hover:bg-white/10"
                >
                  Reply
                </button>
              ) : null}
            </div>

            {replyTo === comment.id && me ? (
              <div className="mt-3 flex gap-3">
                <AuthorAvatar
                  name={displayName(me)}
                  avatarUrl={me.avatar_url}
                  size={24}
                />
                <div className="min-w-0 flex-1">
                  <input
                    value={replyBody}
                    onChange={(e) => {
                      setReplyBody(e.target.value.slice(0, COMMENT_MAX_LENGTH));
                      if (replyError) setReplyError(null);
                    }}
                    placeholder="Add a reply…"
                    className="w-full border-0 border-b border-[#717171] bg-transparent py-1 text-sm text-[#f1f1f1] placeholder:text-[#717171] outline-none transition focus:border-[#fff]"
                    autoFocus
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyBody("");
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-medium text-[#f1f1f1] hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={posting || !replyBody.trim()}
                      onClick={() => void handleReply(comment.id)}
                      className="rounded-full bg-[#3ea6ff] px-3 py-1.5 text-xs font-medium text-[#0f0f0f] transition disabled:cursor-not-allowed disabled:bg-[#272727] disabled:text-[#717171]"
                    >
                      Reply
                    </button>
                  </div>
                  {replyError ? (
                    <p className="mt-1 text-xs text-[#ff4e45]" role="alert">
                      {replyError}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!isReply && replies.length > 0 ? (
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedReplies((prev) => {
                      const next = new Set(prev);
                      if (next.has(comment.id)) next.delete(comment.id);
                      else next.add(comment.id);
                      return next;
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[#3ea6ff] transition hover:bg-[#3ea6ff]/15"
                >
                  <ChevronIcon open={repliesOpen} />
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </button>
                {repliesOpen ? (
                  <ul className="mt-2 space-y-3 border-l border-[#272727] pl-3">
                    {replies.map((r) => renderComment(r, true))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  const countLabel = `${roots.length.toLocaleString()} Comment${roots.length === 1 ? "" : "s"}`;

  return (
    <section className={`animate-rise ${className}`.trim()} id="comments">
      {/* Header: count + sort */}
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <h2 className="text-xl font-bold tracking-tight text-[#f1f1f1]">
          {loading ? "Comments" : countLabel}
        </h2>
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setSortOpen((o) => !o)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#f1f1f1] transition hover:text-white"
          >
            <SortIcon />
            Sort by
          </button>
          {sortOpen ? (
            <div className="absolute left-0 top-9 z-20 min-w-[160px] overflow-hidden rounded-xl bg-[#282828] py-2 shadow-xl ring-1 ring-white/10">
              {(
                [
                  ["top", "Top comments"],
                  ["newest", "Newest first"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSort(value);
                    setSortOpen(false);
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-white/10 ${
                    sort === value
                      ? "bg-white/10 font-medium text-white"
                      : "text-[#f1f1f1]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Composer */}
      <div className="mb-6">
        {!configured ? (
          <p className="text-sm text-[#aaa]">Comments aren’t available right now.</p>
        ) : me ? (
          <form onSubmit={handlePost} className="flex gap-3">
            <AuthorAvatar
              name={displayName(me)}
              avatarUrl={me.avatar_url}
              size={40}
            />
            <div className="min-w-0 flex-1">
              <label htmlFor={`${formId}-body`} className="sr-only">
                Add a comment
              </label>
              <textarea
                id={`${formId}-body`}
                value={body}
                rows={composerOpen || body ? 2 : 1}
                onFocus={() => setComposerOpen(true)}
                onChange={(e) => {
                  setBody(e.target.value.slice(0, COMMENT_MAX_LENGTH));
                  if (formError) setFormError(null);
                }}
                maxLength={COMMENT_MAX_LENGTH}
                placeholder="Add a comment…"
                className="w-full resize-none border-0 border-b border-[#717171] bg-transparent py-1 text-sm leading-5 text-[#f1f1f1] placeholder:text-[#717171] outline-none transition focus:border-[#fff]"
              />
              {composerOpen || body ? (
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBody("");
                      setComposerOpen(false);
                      setFormError(null);
                    }}
                    className="rounded-full px-4 py-2 text-sm font-medium text-[#f1f1f1] transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={posting || !body.trim()}
                    className="rounded-full bg-[#3ea6ff] px-4 py-2 text-sm font-medium text-[#0f0f0f] transition disabled:cursor-not-allowed disabled:bg-[#272727] disabled:text-[#717171]"
                  >
                    {posting ? "Commenting…" : "Comment"}
                  </button>
                </div>
              ) : null}
              {formError ? (
                <p className="mt-2 text-sm text-[#ff4e45]" role="alert">
                  {formError}
                </p>
              ) : null}
            </div>
          </form>
        ) : (
          <div className="flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#272727] text-sm text-[#aaa]">
              ?
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3 border-b border-[#717171] pb-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#aaa]">
                <Link href={loginHref} className="text-[#3ea6ff] hover:underline">
                  Sign in
                </Link>
                {" "}
                to add a comment
                {" · "}
                <Link href={signupHref} className="text-[#3ea6ff] hover:underline">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Thread */}
      {loading ? (
        <ul className="space-y-5" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#272727]" />
              <div className="min-w-0 flex-1 space-y-2 pt-1">
                <div className="h-3 w-40 animate-pulse rounded bg-[#272727]" />
                <div className="h-3 w-full max-w-lg animate-pulse rounded bg-[#1f1f1f]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-[#1a1a1a]" />
              </div>
            </li>
          ))}
        </ul>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-sm text-[#ff4e45]">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadComments();
            }}
            className="mt-3 text-sm text-[#aaa] underline-offset-2 hover:text-[#f1f1f1] hover:underline"
          >
            Try again
          </button>
        </div>
      ) : roots.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-[#aaa]">No comments yet</p>
        </div>
      ) : (
        <ul className="space-y-1">{roots.map((c) => renderComment(c))}</ul>
      )}
    </section>
  );
}
