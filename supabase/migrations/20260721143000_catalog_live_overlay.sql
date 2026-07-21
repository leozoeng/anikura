-- Live catalog overlay for scheduled Anikoto light syncs (Vercel cron).
-- Base library stays in data/catalog.json; this row holds recent title/episode drift.

create table if not exists public.catalog_live (
  id int primary key default 1 check (id = 1),
  overlay jsonb not null default '{}'::jsonb,
  meta jsonb,
  synced_at timestamptz not null default now()
);

alter table public.catalog_live enable row level security;

drop policy if exists "Anyone can read catalog live overlay" on public.catalog_live;
create policy "Anyone can read catalog live overlay"
  on public.catalog_live
  for select
  to anon, authenticated
  using (true);

revoke all on public.catalog_live from public;
grant select on public.catalog_live to anon, authenticated;
grant all on public.catalog_live to service_role;

insert into public.catalog_live (id, overlay, meta)
values (1, '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;
