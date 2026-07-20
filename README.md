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
- Auth.js (NextAuth v5) + Discord OAuth
- Anikoto API for listings, series, episode embeds
- Local JSON catalog for browse / genres / search

## Discord sign-in

Users can create an account / sign in with Discord from the header. After a successful OAuth connect, they are redirected to the Anikura Discord invite: [discord.gg/cm72gXTASn](https://discord.gg/cm72gXTASn).

### 1. Copy env template

```bash
cp .env.example .env.local
```

Required variables (see `.env.example` for comments):

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Auth.js session secret (`openssl rand -base64 32`) |
| `AUTH_URL` | App origin, e.g. `http://localhost:3000` |
| `AUTH_DISCORD_ID` | Discord OAuth Client ID |
| `AUTH_DISCORD_SECRET` | Discord OAuth Client Secret |

### 2. Discord Developer Portal

1. Create an application at [discord.com/developers/applications](https://discord.com/developers/applications).
2. **OAuth2 → Redirects**: add `http://localhost:3000/api/auth/callback/discord` (and your production callback URL).
3. Copy **Client ID** → `AUTH_DISCORD_ID`, **Client Secret** → `AUTH_DISCORD_SECRET`.
