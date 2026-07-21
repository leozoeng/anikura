export const COMMENT_MAX_LENGTH = 2000;

export type CommentLanguage = "sub" | "dub";

export type CommentAuthor = {
  id: string;
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
  created_at: string;
  updated_at: string;
  author: CommentAuthor | null;
};

export const COMMENT_SELECT =
  "id, anime_id, episode, language, user_id, body, created_at, updated_at, author:profiles!anime_comments_user_id_fkey(id, nickname, avatar_url, email)";

export function validateCommentBody(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Write something before posting.";
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return `Comments can be at most ${COMMENT_MAX_LENGTH} characters.`;
  }
  return null;
}

export function formatCommentTime(iso: string) {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    }).format(date);
  } catch {
    return iso.slice(0, 10);
  }
}
