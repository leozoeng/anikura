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
npm run sync
```

Pulls the full Anikoto catalog (~9k titles), builds genre indexes into `data/`.

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

**Option A — env (app gate):**

```bash
ADMIN_EMAIL=you@example.com
```

Also add the same email to the DB allowlist so admin RPCs / RLS succeed:

```sql
insert into private.admin_allowlist (email)
values (lower('you@example.com'))
on conflict do nothing;

update public.profiles
set role = 'admin'
where lower(email) = lower('you@example.com');
```

**Option B — role only:**

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
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
