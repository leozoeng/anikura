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

/** Apply AniList HD cover map onto catalog rows (server-side). */
export function applyPosterHdMap(
  catalog: { poster: string; ani_id?: string | null }[],
  hdByAniId: Record<string, string>,
): void {
  for (const anime of catalog) {
    const key = String(anime.ani_id ?? "").trim();
    if (!key) continue;
    const hd = hdByAniId[key]?.trim();
    if (hd) anime.poster = hd;
  }
}
