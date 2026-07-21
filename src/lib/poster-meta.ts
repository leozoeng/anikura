/** Readable labels for catalog `terms_by_type.type` and AniList `format`. */
const TYPE_LABELS: Record<string, string> = {
  TV: "TV",
  ONA: "ONA",
  OVA: "OVA",
  MOVIE: "Movie",
  SPECIAL: "Special",
  MUSIC: "Music",
  TV_SHORT: "Short",
  TV_SPECIAL: "TV Special",
};

/** Map TV / ONA / Movie / etc. to a short display label. */
export function formatAnimeType(type?: string | null): string | null {
  if (!type) return null;
  const raw = type.trim();
  if (!raw) return null;
  const key = raw.toUpperCase().replace(/[\s-]+/g, "_");
  if (TYPE_LABELS[key]) return TYPE_LABELS[key];
  // Catalog already stores "TV", "Movie", "TV Special", etc.
  if (/^[A-Z0-9][A-Za-z0-9 /+-]*$/.test(raw) && raw.length <= 16) return raw;
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Normalize catalog scores ("8.1") and AniList averageScore (0–100) to a
 * display string like "8.1".
 */
export function formatPosterScore(
  score?: string | number | null,
): string | null {
  if (score == null || score === "" || score === "N/A") return null;
  const n = typeof score === "number" ? score : Number(score);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > 10) return (n / 10).toFixed(1);
  if (typeof score === "string") return score.trim();
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export type PosterMetaInput = {
  type?: string | null;
  year?: number | string | null;
  score?: string | number | null;
};

/** Build `TV · 2017 · ★ 8.1` (omitting missing parts). */
export function formatPosterMeta({
  type,
  year,
  score,
}: PosterMetaInput): string | null {
  const bits: string[] = [];
  const typeLabel = formatAnimeType(type);
  if (typeLabel) bits.push(typeLabel);

  const yearNum =
    typeof year === "number"
      ? year
      : year != null && year !== ""
        ? Number(year)
        : NaN;
  if (Number.isFinite(yearNum) && yearNum > 0) bits.push(String(yearNum));

  const scoreLabel = formatPosterScore(score);
  if (scoreLabel) bits.push(`★ ${scoreLabel}`);

  return bits.length ? bits.join(" · ") : null;
}
