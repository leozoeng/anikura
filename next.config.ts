import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Serve originals directly — never hit Vercel `/_next/image` (402 quota)
     * and never proxy via wsrv (AniList blocked by their policy → broken posters).
     * CDNs (anipix / AniList / Supabase) load fine as plain <img> URLs.
     */
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.anipixcdn.co" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "img.anilist.co" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "**.crunchyroll.com" },
      { protocol: "https", hostname: "img1.ak.crunchyroll.com" },
      { protocol: "https", hostname: "**.vrv.co" },
      { protocol: "https", hostname: "artworks.thetvdb.com" },
      { protocol: "https", hostname: "**.thetvdb.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "atsu.moe" },
      { protocol: "https", hostname: "cdn.atsu.moe" },
      {
        protocol: "https",
        hostname: "yotvmnkhxqdztuqnvzpq.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/@:username",
        destination: "/u/:username",
      },
      {
        source: "/%40:username",
        destination: "/u/:username",
      },
    ];
  },
};

export default nextConfig;
