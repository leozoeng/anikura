import { getGenres, getRecentAnime } from "@/lib/anikoto";
import {
  mergeCatalogWithOverlay,
  saveCatalogLiveOverlay,
} from "@/lib/catalog-live";
import type { CatalogAnime, SyncMeta } from "@/lib/types";

const PER_PAGE = 50;
const DELAY_MS = 350;
/** Recent / airing titles (and episode counts) live near the front of Anikoto. */
export const LIGHT_REFRESH_PAGES = 20;

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

function changedEnough(a: CatalogAnime | undefined, b: CatalogAnime) {
  if (!a) return true;
  return (
    a.episodes !== b.episodes ||
    a.score !== b.score ||
    a.status !== b.status ||
    a.poster !== b.poster ||
    a.title !== b.title ||
    a.updated_at !== b.updated_at ||
    a.next_air_ep !== b.next_air_ep ||
    a.next_air_schedule_time !== b.next_air_schedule_time ||
    JSON.stringify(a.genres) !== JSON.stringify(b.genres)
  );
}

export type LightSyncResult = {
  ok: true;
  pages: number;
  overlayCount: number;
  totalAnime: number;
  availableTotal: number;
  meta: SyncMeta;
  wroteLive: boolean;
};

/**
 * Refresh the newest Anikoto pages and persist a compact overlay
 * (new titles + changed episode counts / scores) to Supabase catalog_live.
 */
export async function runLightCatalogSync(options: {
  baseCatalog: CatalogAnime[];
  pages?: number;
  persistLive?: boolean;
}): Promise<LightSyncResult> {
  const pages = options.pages ?? LIGHT_REFRESH_PAGES;
  const persistLive = options.persistLive ?? true;

  const first = await getRecentAnime(1, PER_PAGE, { cache: "no-store" });
  const availablePages = first.pagination.total_pages;
  const availableTotal = first.pagination.total;
  const lightTo = Math.min(pages, availablePages);

  const byId = new Map<number, CatalogAnime>();
  for (const item of options.baseCatalog) byId.set(item.id, item);

  const ingest = (list: typeof first.anime) => {
    for (const anime of list) {
      byId.set(anime.id, {
        ...anime,
        genres: getGenres(anime),
      });
    }
  };

  ingest(first.anime);
  for (let page = 2; page <= lightTo; page++) {
    await sleep(DELAY_MS);
    try {
      const { anime } = await getRecentAnime(page, PER_PAGE, {
        cache: "no-store",
      });
      ingest(anime);
    } catch (err) {
      console.warn(`Light catalog page ${page} failed:`, err);
    }
  }

  const baseById = new Map(options.baseCatalog.map((a) => [a.id, a]));
  const overlay: Record<string, CatalogAnime> = {};
  for (const item of byId.values()) {
    if (changedEnough(baseById.get(item.id), item)) {
      overlay[String(item.id)] = item;
    }
  }

  const merged = sortCatalog([...byId.values()]);
  const meta: SyncMeta = {
    syncedAt: new Date().toISOString(),
    totalAnime: merged.length,
    pagesFetched: lightTo,
    totalPagesAvailable: availablePages,
  };

  let wroteLive = false;
  if (persistLive && Object.keys(overlay).length > 0) {
    await saveCatalogLiveOverlay(overlay, meta);
    wroteLive = true;
  } else if (persistLive) {
    // Still stamp synced_at so operators can see the job ran.
    await saveCatalogLiveOverlay({}, meta);
    wroteLive = true;
  }

  return {
    ok: true,
    pages: lightTo,
    overlayCount: Object.keys(overlay).length,
    totalAnime: merged.length,
    availableTotal,
    meta,
    wroteLive,
  };
}

export function applyLiveOverlay(
  base: CatalogAnime[],
  overlay: Record<string, CatalogAnime> | null | undefined,
) {
  return mergeCatalogWithOverlay(base, overlay);
}
