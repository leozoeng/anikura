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

Users can create an account / sign in with Discord from the header. After a successful OAuth connect, Anikura auto-joins them to the community server (`discord.gg/cm72gXTASn`) via the `guilds.join` flow.

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
| `DISCORD_GUILD_ID` | Anikura guild snowflake (`1528840790221131806` for invite `cm72gXTASn`) |
| `DISCORD_BOT_TOKEN` | Bot token used to `PUT /guilds/{id}/members/{user}` |

Without `DISCORD_BOT_TOKEN` / `DISCORD_GUILD_ID`, sign-in still works; auto-join is skipped (logged as a warning).

### 2. Discord Developer Portal

1. Create an application at [discord.com/developers/applications](https://discord.com/developers/applications).
2. **OAuth2 → Redirects**: add `http://localhost:3000/api/auth/callback/discord` (and your production callback URL).
3. Copy **Client ID** → `AUTH_DISCORD_ID`, **Client Secret** → `AUTH_DISCORD_SECRET`.
4. **Bot**: add a bot, copy the token → `DISCORD_BOT_TOKEN`.
5. Invite the bot to the Anikura server with **Create Instant Invite** (minimum needed for Add Guild Member). Example invite URL (replace `CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=1&scope=bot
```

6. Confirm **Server Settings → Widget** (or Developer Mode → Copy Server ID) matches `DISCORD_GUILD_ID`.
