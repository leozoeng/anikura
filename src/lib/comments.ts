export const COMMENT_MAX_LENGTH = 2000;

export type CommentLanguage = "sub" | "dub";

export type CommentAuthor = {
  id: string;
  username?: string | null;
  nickname: string | null;
  avatar_url: string | null;
  email: string | null;
};

export type AnimeComment = {
  id: string;
  anime_id: number;
  episode: number;
  language: CommentLanguage;
  user_id: string;
  body: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author: CommentAuthor | null;
  like_count: number;
  liked_by_me: boolean;
};

export const COMMENT_SELECT =
  "id, anime_id, episode, language, user_id, body, parent_id, created_at, updated_at, author:profiles!anime_comments_user_id_fkey(id, username, nickname, avatar_url, email)";

export function validateCommentBody(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Write something before posting.";
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return `Comments can be at most ${COMMENT_MAX_LENGTH} characters.`;
  }
  return null;
}

/** YouTube-ish relative time: "just now", "5 minutes ago", "2 years ago". */
export function formatCommentTime(iso: string) {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "just now";
    if (mins === 1) return "1 minute ago";
    if (mins < 60) return `${mins} minutes ago`;
    const hours = Math.floor(mins / 60);
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months === 1) return "1 month ago";
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(days / 365);
    if (years === 1) return "1 year ago";
    return `${years} years ago`;
  } catch {
    return iso.slice(0, 10);
  }
}

export function formatLikeCount(n: number) {
  if (n <= 0) return "";
  if (n < 1000) return String(n);
  if (n < 10_000) {
    const v = (n / 1000).toFixed(1);
    return `${v.replace(/\.0$/, "")}K`;
  }
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export type CommentSort = "top" | "newest";

export type ProfileCommentItem = {
  id: string;
  anime_id: number;
  episode: number;
  language: CommentLanguage;
  body: string;
  parent_id: string | null;
  created_at: string;
  animeTitle: string;
  animeSlug: string;
  animePoster: string | null;
};

export function sortComments(comments: AnimeComment[], sort: CommentSort) {
  const copy = [...comments];
  if (sort === "newest") {
    copy.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } else {
    copy.sort((a, b) => {
      if (b.like_count !== a.like_count) return b.like_count - a.like_count;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }
  return copy;
}
