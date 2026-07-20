import { NextRequest, NextResponse } from "next/server";
import { searchAnime, searchLocal, type SearchHit } from "@/lib/search";

export const dynamic = "force-dynamic";

export type { SearchHit };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] as SearchHit[] });
  }

  // `scope=local` returns catalog-only hits for instant UI paint.
  const scope = req.nextUrl.searchParams.get("scope");
  const results =
    scope === "local" ? await searchLocal(q) : await searchAnime(q);

  return NextResponse.json(
    { results },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    },
  );
}
