export type ListStatus =
  | "watching"
  | "completed"
  | "planned"
  | "dropped"
  | "on_hold";

export const LIST_STATUSES: { id: ListStatus; label: string }[] = [
  { id: "watching", label: "Watching" },
  { id: "completed", label: "Completed" },
  { id: "planned", label: "Plan to watch" },
  { id: "on_hold", label: "On hold" },
  { id: "dropped", label: "Dropped" },
];

export type AnimeListEntry = {
  id: string;
  user_id: string;
  anime_id: number;
  slug: string;
  title: string;
  poster: string;
  status: ListStatus;
  is_favorite: boolean;
  updated_at: string;
  created_at: string;
};

export type AnimeListInput = {
  anime_id: number;
  slug: string;
  title: string;
  poster: string;
};

export function labelForStatus(status: ListStatus) {
  return LIST_STATUSES.find((s) => s.id === status)?.label ?? status;
}
