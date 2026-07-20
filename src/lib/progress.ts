export type EpisodeProgress = {
  animeId: number;
  episode: number;
  percent: number;
  language: "sub" | "dub";
  updatedAt: number;
};

export type WatchProgress = {
  id: number;
  slug: string;
  title: string;
  poster: string;
  episode: number;
  language: "sub" | "dub";
  percent: number;
  updatedAt: number;
};

export type WatchSettings = {
  autoplayNext: boolean;
  theaterMode: boolean;
};

const CONTINUE_KEY = "anikura:continue";
const PROGRESS_KEY = "anikura:episode-progress";
const SETTINGS_KEY = "anikura:watch-settings";
const MAX = 24;

const DEFAULT_SETTINGS: WatchSettings = {
  autoplayNext: true,
  theaterMode: false,
};

function readContinue(): WatchProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONTINUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WatchProgress[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeContinue(items: WatchProgress[]) {
  localStorage.setItem(CONTINUE_KEY, JSON.stringify(items.slice(0, MAX)));
}

function readAllProgress(): Record<string, EpisodeProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, EpisodeProgress>;
  } catch {
    return {};
  }
}

function progressKey(animeId: number, episode: number, language: string) {
  return `${animeId}:${episode}:${language}`;
}

export function getWatchSettings(): WatchSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveWatchSettings(patch: Partial<WatchSettings>) {
  const next = { ...getWatchSettings(), ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("anikura:settings"));
  return next;
}

export function getContinueWatching(): WatchProgress[] {
  return readContinue().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getEpisodeProgress(
  animeId: number,
  episode: number,
  language: "sub" | "dub",
) {
  const all = readAllProgress();
  return all[progressKey(animeId, episode, language)]?.percent ?? 0;
}

export function getLatestProgressForAnime(animeId: number) {
  const all = readAllProgress();
  const entries = Object.values(all).filter((e) => e.animeId === animeId);
  if (!entries.length) return null;
  return entries.sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

export function saveEpisodeProgress(
  animeId: number,
  episode: number,
  language: "sub" | "dub",
  percent: number,
) {
  const all = readAllProgress();
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  all[progressKey(animeId, episode, language)] = {
    animeId,
    episode,
    percent: clamped,
    language,
    updatedAt: Date.now(),
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("anikura:progress"));
}

export function saveWatchProgress(entry: {
  id: number;
  slug: string;
  title: string;
  poster: string;
  episode: number;
  language: "sub" | "dub";
  percent?: number;
}) {
  const percent = entry.percent ?? getEpisodeProgress(entry.id, entry.episode, entry.language);
  const items = readContinue().filter((x) => x.id !== entry.id);
  items.unshift({
    ...entry,
    percent,
    updatedAt: Date.now(),
  });
  writeContinue(items);
}

export function clearContinueWatching() {
  localStorage.removeItem(CONTINUE_KEY);
}

export function getProgressMapForAnime(animeId: number, language: "sub" | "dub") {
  const all = readAllProgress();
  const map = new Map<number, number>();
  for (const entry of Object.values(all)) {
    if (entry.animeId === animeId && entry.language === language) {
      map.set(entry.episode, entry.percent);
    }
  }
  return map;
}
