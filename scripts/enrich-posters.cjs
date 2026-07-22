/**
 * Build data/poster-hd.json — AniList extraLarge covers keyed by ani_id.
 * Run: node scripts/enrich-posters.mjs
 */
const fs = require("fs");
const path = require("path");

const CATALOG = path.join(__dirname, "../data/catalog.json");
const OUT = path.join(__dirname, "../data/poster-hd.json");
const BATCH = 50;
const DELAY_MS = 700;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchCovers(ids) {
  const query = `query ($ids: [Int]) {
    Page(page: 1, perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        coverImage { extraLarge large }
      }
    }
  }`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: { ids } }),
  });
  if (res.status === 429) {
    const retry = Number(res.headers.get("retry-after") || 60);
    await sleep(retry * 1000);
    return fetchCovers(ids);
  }
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const json = await res.json();
  return json?.data?.Page?.media ?? [];
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const rows = Array.isArray(catalog) ? catalog : catalog.anime || [];
  const ids = [
    ...new Set(
      rows
        .map((a) => Number(a.ani_id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  ];

  const existing = fs.existsSync(OUT)
    ? JSON.parse(fs.readFileSync(OUT, "utf8"))
    : {};
  const map = { ...existing };
  let filled = 0;

  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const need = batch.filter((id) => !map[String(id)]);
    if (need.length === 0) {
      process.stdout.write(
        `skip ${i / BATCH + 1}/${Math.ceil(ids.length / BATCH)}\r`,
      );
      continue;
    }
    try {
      const media = await fetchCovers(need);
      for (const m of media) {
        const url = m.coverImage?.extraLarge || m.coverImage?.large;
        if (url) {
          map[String(m.id)] = url;
          filled++;
        }
      }
      process.stdout.write(
        `batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(ids.length / BATCH)} (+${filled})\r`,
      );
    } catch (err) {
      console.warn(`\nbatch failed at ${i}:`, err.message);
      await sleep(5000);
      i -= BATCH; // retry
      continue;
    }
    fs.writeFileSync(OUT, JSON.stringify(map));
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(OUT, JSON.stringify(map));
  console.log(`\nWrote ${OUT} with ${Object.keys(map).length} covers (${filled} new).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
