import { promises as fs } from "fs";
import path from "path";
import type { CatalogAnime, GenreStat, SyncMeta } from "./types";
import { slugifyGenre } from "./anikoto";

const DATA_DIR = path.join(process.cwd(), "data");
const CATALOG_PATH = path.join(DATA_DIR, "catalog.json");
const GENRES_PATH = path.join(DATA_DIR, "genres.json");
const META_PATH = path.join(DATA_DIR, "sync-meta.json");

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function getCatalog(): Promise<CatalogAnime[]> {
  return (await readJson<CatalogAnime[]>(CATALOG_PATH)) ?? [];
}

export async function getGenreStats(): Promise<GenreStat[]> {
  return (await readJson<GenreStat[]>(GENRES_PATH)) ?? [];
}

export async function getSyncMeta(): Promise<SyncMeta | null> {
  return readJson<SyncMeta>(META_PATH);
}

export async function saveCatalog(
  catalog: CatalogAnime[],
  meta: SyncMeta,
) {
  await ensureDataDir();

  const genreMap = new Map<string, number>();
  for (const anime of catalog) {
    for (const genre of anime.genres) {
      genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1);
    }
  }

  const genres: GenreStat[] = [...genreMap.entries()]
    .map(([name, count]) => ({
      name,
      slug: slugifyGenre(name),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  await Promise.all([
    fs.writeFile(CATALOG_PATH, JSON.stringify(catalog)),
    fs.writeFile(GENRES_PATH, JSON.stringify(genres, null, 2)),
    fs.writeFile(META_PATH, JSON.stringify(meta, null, 2)),
  ]);

  return { genres, meta };
}

export async function findAnimeById(id: number) {
  const catalog = await getCatalog();
  return catalog.find((a) => a.id === id) ?? null;
}

export async function findAnimeBySlug(slug: string) {
  const catalog = await getCatalog();
  return catalog.find((a) => a.slug === slug) ?? null;
}

export async function searchCatalog(query: string, limit = 40) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const catalog = await getCatalog();
  const scored = catalog
    .map((anime) => {
      const hay = [
        anime.title,
        anime.alternative,
        anime.native,
        anime.titles,
        ...(anime.genres ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      let score = 0;
      if (anime.title.toLowerCase() === q) score += 100;
      if (anime.title.toLowerCase().startsWith(q)) score += 50;
      if (anime.title.toLowerCase().includes(q)) score += 25;
      if (hay.includes(q)) score += 10;
      return { anime, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.anime.score) - Number(a.anime.score));

  return scored.slice(0, limit).map((x) => x.anime);
}

export async function getByGenre(slug: string, limit = 48, offset = 0) {
  const catalog = await getCatalog();
  const filtered = catalog.filter((anime) =>
    anime.genres.some((g) => slugifyGenre(g) === slug),
  );

  return {
    total: filtered.length,
    anime: filtered.slice(offset, offset + limit),
  };
}

export async function getTopRated(limit = 24) {
  const catalog = await getCatalog();
  return [...catalog]
    .filter((a) => a.score && a.score !== "N/A" && Number(a.score) > 0)
    .sort((a, b) => Number(b.score) - Number(a.score))
    .slice(0, limit);
}

export async function getByStatus(statusIncludes: string, limit = 24) {
  const catalog = await getCatalog();
  const needle = statusIncludes.toLowerCase();
  return catalog
    .filter((a) => a.status?.toLowerCase().includes(needle))
    .slice(0, limit);
}
