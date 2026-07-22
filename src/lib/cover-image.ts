/** Best available AniList cover URL (extraLarge → large → medium). */
export function bestAniListCover(
  cover?: {
    extraLarge?: string | null;
    large?: string | null;
    medium?: string | null;
  } | null,
): string {
  return (
    cover?.extraLarge?.trim() ||
    cover?.large?.trim() ||
    cover?.medium?.trim() ||
    ""
  );
}

/**
 * Prefer a sharper AniList CDN variant when the URL encodes a size segment.
 * (AniList: small < medium < large. Their API "extraLarge" maps to `/cover/large/`.)
 */
export function preferHighResPoster(url: string | null | undefined): string {
  const src = url?.trim() || "";
  if (!src) return "";
  if (!src.includes("anilistcdn") && !src.includes("anilist.co")) return src;
  return src
    .replace(/\/cover\/small\//, "/cover/large/")
    .replace(/\/cover\/medium\//, "/cover/large/");
}
