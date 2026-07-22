export type ListStatus =
  | "watching"
  | "completed"
  | "planned"
  | "dropped"
  | "on_hold";

/**
 * Board shelves + series list dropdown statuses.
 * Favourites is a separate `is_favorite` flag (not a status).
 * `planned` / `dropped` remain in the DB type for legacy rows only.
 */
export const BOARD_LIST_STATUSES: {
  id: Extract<ListStatus, "watching" | "completed" | "on_hold">;
  label: string;
}[] = [
  { id: "watching", label: "Watching" },
  { id: "completed", label: "Completed" },
  { id: "on_hold", label: "On Hold" },
];

/** Labels for any known status, including legacy planned/dropped. */
export const LIST_STATUSES: { id: ListStatus; label: string }[] = [
  ...BOARD_LIST_STATUSES,
  { id: "planned", label: "Plan to watch" },
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
