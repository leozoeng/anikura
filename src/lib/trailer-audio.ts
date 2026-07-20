export const TRAILER_VOLUME = 20;
export const TRAILER_MUTE_KEY = "anikura:trailer-muted";

/** Default muted so autoplay is allowed; unmute persists once the user opts in. */
export function isTrailerMuted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TRAILER_MUTE_KEY) !== "false";
}

export function setTrailerMuted(muted: boolean) {
  localStorage.setItem(TRAILER_MUTE_KEY, muted ? "true" : "false");
  window.dispatchEvent(new CustomEvent("anikura:trailer-audio"));
}
