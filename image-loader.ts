"use client";

/**
 * Resize remote images via wsrv.nl so we don't burn Vercel Image Optimization quota.
 * Local `/public` assets pass through with a width hint (ignored by static hosting).
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src) return src;

  if (src.startsWith("data:") || src.startsWith("blob:")) return src;

  if (src.includes("wsrv.nl/") || src.includes("images.weserv.nl/")) {
    return src;
  }

  if (src.startsWith("/")) {
    return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  }

  const absolute = src.startsWith("//") ? `https:${src}` : src;
  if (!/^https?:\/\//i.test(absolute)) return src;

  const q = quality ?? 75;
  const w = Math.min(Math.max(width, 32), 1280);
  return `https://wsrv.nl/?url=${encodeURIComponent(absolute)}&w=${w}&q=${q}&output=webp&n=-1`;
}
