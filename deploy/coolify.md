# Anikura on DigitalOcean + Coolify + Cloudflare

Hetzner was abandoned (account verification failed). Path: **DigitalOcean Droplet (Frankfurt) + Coolify + Cloudflare**.

Target cost: **~$24/mo** droplet + Cloudflare free. Reuses the repo `Dockerfile` (`output: "standalone"`).

If DigitalOcean also blocks verification: try **Vultr** (Amsterdam/Frankfurt) with the same Coolify steps. Temporary bridge only: **Vercel Pro**.

## 1. Create the DigitalOcean Droplet

1. Sign up at [digitalocean.com](https://www.digitalocean.com) → verify identity → add a payment method
2. **Create** → **Droplets**
   - Region: **Frankfurt (FRA1)**
   - Image: **Ubuntu 24.04 LTS**
   - Size: **Basic** → **4 GB RAM / 2 vCPUs / 80 GB SSD** (~$24/mo)
   - Authentication: your **SSH key**
   - Hostname: e.g. `anikura`
3. Networking / Firewall (create or attach):
   - Inbound: **22**, **80**, **443**
   - Also **8000** while setting up Coolify UI (you can close 8000 later once Coolify is on a domain)
4. Create Droplet → copy the **public IPv4**

SSH in:

```bash
ssh root@YOUR_DROPLET_IP
```

## 2. Install Coolify

On the droplet (as root):

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Open `http://YOUR_DROPLET_IP:8000`, create the admin account, finish the wizard.

## 3. Deploy Anikura from GitHub

In Coolify:

1. **Sources** → connect GitHub → grant access to `leozoeng/anikura`
2. **New Resource** → Application → pick **anikura** (`main`)
3. Build pack: **Dockerfile** (repo root `Dockerfile`)
4. Ports: expose **3000**
5. Domains: `anikura.club` and `www.anikura.club` (Coolify requests Let’s Encrypt on the origin)

### Build arguments (required)

`NEXT_PUBLIC_*` values are inlined at **build** time. Set them as **build args and runtime env**:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `NEXT_PUBLIC_SITE_URL` | `https://anikura.club` |

### Runtime environment

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | same as build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as build |
| `NEXT_PUBLIC_SITE_URL` | `https://anikura.club` |
| `SUPABASE_SERVICE_ROLE_KEY` | service role (server only) |
| `CRON_SECRET` | long random string |
| `ADMIN_EMAIL` | your admin email(s), comma-separated |
| `DISCORD_GUILD_ID` | Discord server ID (members-only gate) |
| `DISCORD_BOT_TOKEN` | Bot token with Server Members Intent |
| `NEXT_PUBLIC_DISCORD_INVITE_URL` | optional invite URL override |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `HOSTNAME` | `0.0.0.0` |

Copy from local `.env.local` / old Vercel env. Never commit secrets.

### Discord members-only gate

1. Discord Developer Portal → create an application → enable a **Bot** with **Server Members Intent**.
2. Invite the bot to the Anikura server.
3. Supabase → Authentication → Providers → **Discord** (Client ID + Secret from the same app). Add redirect `https://anikura.club/auth/callback`.
4. Set `DISCORD_GUILD_ID`, `DISCORD_BOT_TOKEN`, and optionally `NEXT_PUBLIC_DISCORD_INVITE_URL`.
5. Until those are set, only the **account** gate runs. With them set, users must link Discord + join the server before browsing/watching.

Deploy → wait for green. Smoke-test Coolify’s preview URL before DNS cutover.

## 4. Cloudflare DNS cutover

In Cloudflare → `anikura.club` → DNS:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | DigitalOcean droplet IPv4 | Proxied (orange) |
| CNAME | `www` | `anikura.club` | Proxied (orange) |

SSL/TLS → Overview → **Full (strict)** after Coolify has a valid origin cert.

### Recommended cache rules

Bypass cache for:

- `/api/*`
- `/admin*`
- `/auth/*`
- `/login*`
- `/watch/*`
- `/manga/*/read/*`
- `/novels/*/read/*`

`/_next/static/*` can stay cached.

### After DNS propagates

1. Check `https://anikura.club` — home, login, watch, manga, novels, admin
2. Supabase Auth redirect URLs should already include `https://anikura.club/**` and `/auth/callback`
3. Leave Vercel paused / remove the project when stable

## 5. Catalog sync cron (replaces Vercel Cron)

Vercel’s `vercel.json` cron does **not** run on Coolify. Schedule daily:

**URL:** `https://anikura.club/api/cron/catalog-sync`  
**Method:** `GET`  
**Header:** `Authorization: Bearer YOUR_CRON_SECRET`  
**Schedule:** `20 6 * * *` (06:20 UTC)

On the droplet (`crontab -e`):

```bash
20 6 * * * curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" https://anikura.club/api/cron/catalog-sync >/dev/null
```

## 6. Local Docker smoke test (optional)

```bash
cp .env.example .env   # fill real values
docker compose build
docker compose up
# open http://localhost:3000
```

## Rollback

Point the Cloudflare A record back to Vercel (or unpause Vercel) if the droplet misbehaves. Supabase is unchanged either way.

## Upgrade path

If the 4 GB box runs hot under traffic, resize the droplet in DO to **8 GB / 4 vCPUs** — no architecture change.
