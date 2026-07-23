/** Classify browser User-Agent into Night desk device buckets. */

export type PresenceDevice = "desktop" | "ios" | "android" | "other";

export const PRESENCE_DEVICE_ORDER: PresenceDevice[] = [
  "desktop",
  "ios",
  "android",
  "other",
];

export const PRESENCE_DEVICE_LABEL: Record<PresenceDevice, string> = {
  desktop: "Desktop",
  ios: "iOS",
  android: "Android",
  other: "Other",
};

export function classifyUserAgent(
  ua: string | null | undefined,
): PresenceDevice {
  if (!ua) return "other";
  const s = ua.toLowerCase();

  if (/iphone|ipad|ipod/.test(s)) return "ios";
  if (/android/.test(s)) return "android";

  // Desktop OSes / Chromebook before generic "mobile" leftovers.
  if (
    /windows nt|macintosh|mac os x|cros|x11|linux/.test(s) &&
    !/mobile|phone|tablet/.test(s)
  ) {
    return "desktop";
  }

  return "other";
}

export function normalizePresenceDevice(
  value: string | null | undefined,
): PresenceDevice | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (
    v === "desktop" ||
    v === "ios" ||
    v === "android" ||
    v === "other"
  ) {
    return v;
  }
  return "other";
}
