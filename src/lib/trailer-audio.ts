export const TRAILER_VOLUME = 20;
export const TRAILER_MUTE_KEY = "anikura:trailer-muted";

export function isTrailerMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TRAILER_MUTE_KEY) === "true";
}

export function setTrailerMuted(muted: boolean) {
  localStorage.setItem(TRAILER_MUTE_KEY, muted ? "true" : "false");
  window.dispatchEvent(new CustomEvent("anikura:trailer-audio"));
}
