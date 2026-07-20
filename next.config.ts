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
    ],
  },
};

export default nextConfig;
