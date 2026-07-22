import Image, { type ImageProps } from "next/image";

/**
 * Site-wide image primitive: always bypasses Next/Vercel optimization and
 * omits referrer so hotlink-sensitive CDNs (AniList, etc.) keep working.
 */
export function SafeImage({
  referrerPolicy = "no-referrer",
  ...props
}: ImageProps) {
  return <Image {...props} unoptimized referrerPolicy={referrerPolicy} />;
}
