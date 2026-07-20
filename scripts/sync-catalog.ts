import { getGenres, getRecentAnime } from "../src/lib/anikoto";
import { saveCatalog } from "../src/lib/catalog";
import type { CatalogAnime } from "../src/lib/types";

const PER_PAGE = 50;
const DELAY_MS = 400;

// Full sync by default; pass --pages=N to limit for faster first run
function parsePagesArg(): number | null {
  const arg = process.argv.find((a) => a.startsWith("--pages="));
  if (!arg) return null;
  const n = Number(arg.split("=")[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const pageLimit = parsePagesArg();
  console.log("Starting Anikoto catalog sync…");
  if (pageLimit) console.log(`Limited to ${pageLimit} pages`);

  const first = await getRecentAnime(1, PER_PAGE, { cache: "no-store" });
  const totalPages = pageLimit
    ? Math.min(pageLimit, first.pagination.total_pages)
    : first.pagination.total_pages;

  const byId = new Map<number, CatalogAnime>();

  const ingest = (list: typeof first.anime) => {
    for (const anime of list) {
      byId.set(anime.id, {
        ...anime,
        genres: getGenres(anime),
      });
    }
  };

  ingest(first.anime);
  console.log(`Page 1/${totalPages} — ${byId.size} titles`);

  for (let page = 2; page <= totalPages; page++) {
    await sleep(DELAY_MS);
    try {
      const { anime } = await getRecentAnime(page, PER_PAGE, { cache: "no-store" });
      ingest(anime);
      if (page % 10 === 0 || page === totalPages) {
        console.log(`Page ${page}/${totalPages} — ${byId.size} titles`);
      }
    } catch (err) {
      console.warn(`Page ${page} failed:`, err);
      await sleep(2000);
    }
  }

  const catalog = [...byId.values()].sort((a, b) => {
    const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.year || 0) - (a.year || 0);
  });

  const { genres, meta } = await saveCatalog(catalog, {
    syncedAt: new Date().toISOString(),
    totalAnime: catalog.length,
    pagesFetched: totalPages,
    totalPagesAvailable: first.pagination.total_pages,
  });

  console.log("\nSync complete");
  console.log(`  Anime:  ${meta.totalAnime}`);
  console.log(`  Genres: ${genres.length}`);
  console.log(`  Top genres: ${genres.slice(0, 8).map((g) => g.name).join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
