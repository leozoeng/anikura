# Anikura

Premium anime browsing & watching UI powered by the Anikoto catalog API.

## Quick start

```bash
npm install
npm run sync -- --pages=20   # fast first sync (~1000 titles)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Full catalog sync

```bash
npm run sync
```

Pulls the full Anikoto catalog (~9k titles), builds genre indexes into `data/`.

## Stack

- Next.js App Router + Tailwind
- Anikoto API for listings, series, episode embeds
- Local JSON catalog for browse / genres / search
