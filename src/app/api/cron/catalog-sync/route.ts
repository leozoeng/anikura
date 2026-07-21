import { promises as fs } from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { runLightCatalogSync } from "@/lib/catalog-sync";
import type { CatalogAnime } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DATA_DIR = path.join(process.cwd(), "data");
const CATALOG_PATH = path.join(DATA_DIR, "catalog.json");

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function readBaseCatalog(): Promise<CatalogAnime[]> {
  try {
    const raw = await fs.readFile(CATALOG_PATH, "utf8");
    return JSON.parse(raw) as CatalogAnime[];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 500 },
    );
  }

  try {
    const base = await readBaseCatalog();
    const result = await runLightCatalogSync({
      baseCatalog: base,
      persistLive: true,
    });
    return Response.json(result);
  } catch (err) {
    console.error("catalog sync cron failed", err);
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Catalog sync failed",
      },
      { status: 500 },
    );
  }
}
