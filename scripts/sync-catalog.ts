import { getGenres, getRecentAnime } from "../src/lib/anikoto";
import { getCatalog, getSyncMeta, saveCatalog } from "../src/lib/catalog";
import type { CatalogAnime } from "../src/lib/types";

const PER_PAGE = 50;
const DELAY_MS = 400;
/**
 * When Anikoto totals match, still refresh this many leading pages.
 * Recent / airing titles (and their episode counts) live near the front.
 */
const LIGHT_REFRESH_PAGES = 20;

function parsePagesArg(): number | null {
  const arg = process.argv.find((a) => a.startsWith("--pages="));
  if (!arg) return null;
  const n = Number(arg.split("=")[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function sortCatalog(catalog: CatalogAnime[]) {
  return [...catalog].sort((a, b) => {
    const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.year || 0) - (a.year || 0);
  });
}

async function main() {
  const pageLimit = parsePagesArg();
  const force = hasFlag("--force");
  const checkOnly = hasFlag("--check");

  console.log("Starting Anikoto catalog sync…");
  if (pageLimit) console.log(`Limited to ${pageLimit} pages`);
  if (force) console.log("Force full sync");

  const first = await getRecentAnime(1, PER_PAGE, { cache: "no-store" });
  const availablePages = first.pagination.total_pages;
  const availableTotal = first.pagination.total;
  const meta = await getSyncMeta();

  console.log(
    `Anikoto: ${availableTotal.toLocaleString()} titles · ${availablePages} pages`,
  );
  if (meta) {
    console.log(
      `Local:   ${meta.totalAnime.toLocaleString()} titles · synced ${meta.syncedAt}`,
    );
  }

  if (checkOnly) {
    const inSync =
      meta != null &&
      meta.totalAnime === availableTotal &&
      meta.totalPagesAvailable === availablePages;
    console.log(inSync ? "Status: in sync" : "Status: out of sync");
    process.exit(inSync ? 0 : 2);
  }

  const totalsMatch =
    meta != null &&
    meta.totalAnime === availableTotal &&
    meta.totalPagesAvailable === availablePages;

  const totalPages = pageLimit
    ? Math.min(pageLimit, availablePages)
    : availablePages;

  const byId = new Map<number, CatalogAnime>();

  const ingest = (list: typeof first.anime) => {
    for (const anime of list) {
      byId.set(anime.id, {
        ...anime,
        genres: getGenres(anime),
      });
    }
  };

  // Fast path: library size unchanged — refresh recent pages + merge into existing catalog
  if (!force && !pageLimit && totalsMatch) {
    console.log(
      `Totals match — light refresh of first ${LIGHT_REFRESH_PAGES} pages…`,
    );
    const existing = await getCatalog();
    for (const item of existing) byId.set(item.id, item);

    ingest(first.anime);
    const lightTo = Math.min(LIGHT_REFRESH_PAGES, availablePages);
    for (let page = 2; page <= lightTo; page++) {
      await sleep(DELAY_MS);
      try {
        const { anime } = await getRecentAnime(page, PER_PAGE, {
          cache: "no-store",
        });
        ingest(anime);
        console.log(`Light page ${page}/${lightTo} — map size ${byId.size}`);
      } catch (err) {
        console.warn(`Light page ${page} failed:`, err);
      }
    }

    const catalog = sortCatalog([...byId.values()]);
    if (JSON.stringify(catalog) === JSON.stringify(existing)) {
      console.log("\nLight sync: no content changes — catalog already current");
      return;
    }

    const { genres, meta: saved } = await saveCatalog(catalog, {
      syncedAt: new Date().toISOString(),
      totalAnime: catalog.length,
      pagesFetched: lightTo,
      totalPagesAvailable: availablePages,
    });

    console.log("\nLight sync complete");
    console.log(`  Anime:  ${saved.totalAnime}`);
    console.log(`  Genres: ${genres.length}`);
    return;
  }

  ingest(first.anime);
  console.log(`Page 1/${totalPages} — ${byId.size} titles`);

  for (let page = 2; page <= totalPages; page++) {
    await sleep(DELAY_MS);
    try {
      const { anime } = await getRecentAnime(page, PER_PAGE, {
        cache: "no-store",
      });
      ingest(anime);
      if (page % 10 === 0 || page === totalPages) {
        console.log(`Page ${page}/${totalPages} — ${byId.size} titles`);
      }
    } catch (err) {
      console.warn(`Page ${page} failed:`, err);
      await sleep(2000);
      try {
        const { anime } = await getRecentAnime(page, PER_PAGE, {
          cache: "no-store",
        });
        ingest(anime);
      } catch (retryErr) {
        console.warn(`Page ${page} retry failed:`, retryErr);
      }
    }
  }

  const catalog = sortCatalog([...byId.values()]);
  const { genres, meta: saved } = await saveCatalog(catalog, {
    syncedAt: new Date().toISOString(),
    totalAnime: catalog.length,
    pagesFetched: totalPages,
    totalPagesAvailable: availablePages,
  });

  console.log("\nSync complete");
  console.log(`  Anime:  ${saved.totalAnime}`);
  console.log(`  Genres: ${genres.length}`);
  console.log(
    `  Top genres: ${genres.slice(0, 8).map((g) => g.name).join(", ")}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
