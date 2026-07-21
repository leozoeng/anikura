# Anikura

Premium anime browsing & watching UI powered by the Anikoto catalog API.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill Supabase URL + anon key
npm run sync -- --pages=20   # fast first sync (~1000 titles)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Full catalog sync

```bash
npm run sync          # full if totals changed; light refresh if already matched
npm run sync:force    # always full re-scrape
npm run sync:check    # exit 0 if local matches Anikoto totals
```

Pulls the Anikoto catalog (~9k titles), builds genre indexes into `data/`.

**Auto-sync:** GitHub Action `.github/workflows/sync-catalog.yml` runs every 6 hours and on manual **Actions → Sync catalog → Run workflow**. Light syncs refresh the newest ~1,000 titles (episode counts, scores, new entries). If totals drift, it does a full scrape. Changed catalog files are committed so Vercel redeploys with a fresh library.

**Episodes:** Watch and series pages always fetch the live Anikoto episode list (`cache: no-store`) — new episodes appear as soon as Anikoto lists them, without waiting for a catalog sync.

## Auth & admin (Supabase)

Anikura uses Supabase Auth (email/password) with `@supabase/ssr` for App Router sessions.

### Env vars

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key |
| `ADMIN_EMAIL` | Comma-separated admin emails for `/admin` |

Copy `.env.example` → `.env.local`.

Project (Leo Zoeng org): `anikura` · region `eu-north-1`.

### Sign up / sign in

Use **Sign in** / **Create account** in the header, or `/login`.

For the simplest local flow, disable email confirmation in the Supabase dashboard:

**Authentication → Providers → Email → Confirm email** → off.

### Make yourself admin

Admin is **email-allowlist only**. New signups always get `role = user` and cannot open `/admin`.

```bash
ADMIN_EMAIL=leozoeng@icloud.com
```

DB allowlist (already seeded for that email):

```sql
delete from private.admin_allowlist
where email is distinct from lower('leozoeng@icloud.com');

insert into private.admin_allowlist (email)
values (lower('leozoeng@icloud.com'))
on conflict do nothing;

update public.profiles
set role = 'admin'
where lower(email) = lower('leozoeng@icloud.com');

update public.profiles
set role = 'user'
where lower(coalesce(email, '')) is distinct from lower('leozoeng@icloud.com');
```

Then open `/admin` for the live dashboard (metrics + active-visitor globe).

### Presence / globe

Clients send heartbeats to `/api/presence` (anon + signed-in). Coarse geo comes from Vercel/Cloudflare headers when available, otherwise a lightweight IP lookup. Stale rows older than 5 minutes are cleaned up on upsert.

Schema lives in `supabase/migrations/` and was applied to the remote project via Supabase MCP.

## Stack

- Next.js App Router + Tailwind v4
- Supabase Auth + Postgres (profiles, presence, analytics)
- Anikoto API for listings, series, episode embeds
- Local JSON catalog for browse / genres / search
- `cobe` for the admin live globe

## Community

Join the Anikura Discord: [discord.gg/cm72gXTASn](https://discord.gg/cm72gXTASn).
