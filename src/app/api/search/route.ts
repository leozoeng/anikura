import { NextRequest, NextResponse } from "next/server";
import { displayTitle, searchAniList } from "@/lib/anilist";
import { animeHref } from "@/lib/anikoto";
import { getCatalog, searchCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export type SearchHit = {
  key: string;
  title: string;
  native?: string | null;
  poster: string;
  year?: number | null;
  score?: string | number | null;
  href: string;
  source: "catalog" | "anilist";
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] as SearchHit[] });
  }

  const [local, anilist, catalog] = await Promise.all([
    searchCatalog(q, 8),
    searchAniList(q, 8),
    getCatalog(),
  ]);

  const byAniId = new Map<number, (typeof catalog)[number]>();
  for (const item of catalog) {
    const ani = Number(item.ani_id);
    if (ani) byAniId.set(ani, item);
  }

  const results: SearchHit[] = [];
  const seen = new Set<string>();

  for (const anime of local) {
    const key = `c-${anime.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      key,
      title: anime.title,
      native: anime.native,
      poster: anime.poster,
      year: anime.year,
      score: anime.score,
      href: animeHref(anime),
      source: "catalog",
    });
  }

  for (const media of anilist) {
    const matched = byAniId.get(media.id);
    if (matched) {
      const key = `c-${matched.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        key,
        title: matched.title,
        native: matched.native || media.title.native,
        poster: matched.poster || media.coverImage?.large || "",
        year: matched.year || media.seasonYear,
        score: matched.score || media.averageScore,
        href: animeHref(matched),
        source: "catalog",
      });
      continue;
    }

    const key = `a-${media.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      key,
      title: displayTitle(media.title),
      native: media.title.native,
      poster: media.coverImage?.large || "",
      year: media.seasonYear,
      score: media.averageScore,
      href: `/search?q=${encodeURIComponent(displayTitle(media.title))}`,
      source: "anilist",
    });
  }

  return NextResponse.json({ results: results.slice(0, 8) });
}
