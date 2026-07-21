import { createClient } from "@supabase/supabase-js";
import type { CatalogAnime, SyncMeta } from "@/lib/types";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";

export type CatalogLiveRow = {
  overlay: Record<string, CatalogAnime>;
  meta: SyncMeta | null;
  synced_at: string;
};

const OVERLAY_MEM_TTL_MS = 60_000;
let overlayMem: { data: CatalogLiveRow | null; at: number } | null = null;

function sortCatalog(catalog: CatalogAnime[]) {
  return [...catalog].sort((a, b) => {
    const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.year || 0) - (a.year || 0);
  });
}

/** Public read of the live overlay (anon key is enough). */
export async function fetchCatalogLive(): Promise<CatalogLiveRow | null> {
  const now = Date.now();
  if (overlayMem && now - overlayMem.at < OVERLAY_MEM_TTL_MS) {
    return overlayMem.data;
  }

  const env = getSupabaseEnv();
  if (!env) {
    overlayMem = { data: null, at: now };
    return null;
  }

  try {
    const supabase = createClient(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("catalog_live")
      .select("overlay, meta, synced_at")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      overlayMem = { data: null, at: now };
      return null;
    }

    const row: CatalogLiveRow = {
      overlay: (data.overlay ?? {}) as Record<string, CatalogAnime>,
      meta: (data.meta as SyncMeta | null) ?? null,
      synced_at: data.synced_at,
    };
    overlayMem = { data: row, at: now };
    return row;
  } catch {
    overlayMem = { data: null, at: now };
    return null;
  }
}

export function mergeCatalogWithOverlay(
  base: CatalogAnime[],
  overlay: Record<string, CatalogAnime> | null | undefined,
): CatalogAnime[] {
  if (!overlay || Object.keys(overlay).length === 0) return base;

  const byId = new Map<number, CatalogAnime>();
  for (const item of base) byId.set(item.id, item);
  for (const item of Object.values(overlay)) {
    if (item?.id != null) byId.set(item.id, item);
  }
  return sortCatalog([...byId.values()]);
}

export async function saveCatalogLiveOverlay(
  overlay: Record<string, CatalogAnime>,
  meta: SyncMeta,
) {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for catalog live sync");
  }

  const { error } = await supabase.from("catalog_live").upsert({
    id: 1,
    overlay,
    meta,
    synced_at: new Date().toISOString(),
  });

  if (error) throw error;
  overlayMem = null;
}

export function clearCatalogLiveCache() {
  overlayMem = null;
}
