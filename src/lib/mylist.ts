export type ListEntry = {
  id: number;
  slug: string;
  title: string;
  poster: string;
  addedAt: number;
};

const KEY = "anikura:mylist";
const MAX = 100;

function read(): ListEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ListEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: ListEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
}

export function getMyList(): ListEntry[] {
  return read().sort((a, b) => b.addedAt - a.addedAt);
}

export function isInMyList(id: number) {
  return read().some((x) => x.id === id);
}

export function toggleMyList(entry: Omit<ListEntry, "addedAt">) {
  const items = read();
  const idx = items.findIndex((x) => x.id === entry.id);
  if (idx >= 0) {
    items.splice(idx, 1);
    write(items);
    window.dispatchEvent(new CustomEvent("anikura:mylist"));
    return false;
  }
  items.unshift({ ...entry, addedAt: Date.now() });
  write(items);
  window.dispatchEvent(new CustomEvent("anikura:mylist"));
  return true;
}

export function removeFromMyList(id: number) {
  write(read().filter((x) => x.id !== id));
  window.dispatchEvent(new CustomEvent("anikura:mylist"));
}
