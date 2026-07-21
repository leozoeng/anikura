import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.anipixcdn.co" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "img.anilist.co" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      // Episode scene stills
      { protocol: "https", hostname: "**.crunchyroll.com" },
      { protocol: "https", hostname: "img1.ak.crunchyroll.com" },
      { protocol: "https", hostname: "**.vrv.co" },
      { protocol: "https", hostname: "artworks.thetvdb.com" },
      { protocol: "https", hostname: "**.thetvdb.com" },
      // YouTube trailer / banner fallbacks
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      // Supabase storage (avatars / banners)
      {
        protocol: "https",
        hostname: "yotvmnkhxqdztuqnvzpq.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  /**
   * solo.to-style bio links: `/@username` → `/u/username`.
   * Proxy (`src/proxy.ts`) also rewrites these (and refreshes the auth session).
   * Config rewrites are a Vercel/CDN-safe backup so vanity URLs still resolve
   * if the proxy matcher misses an edge case (e.g. encoded `%40`).
   * Never use `app/@…` folders — those are parallel routes.
   */
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
