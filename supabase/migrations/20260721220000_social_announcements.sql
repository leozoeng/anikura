-- Dev / admin announcements for the Social tab

create table if not exists public.social_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  pinned boolean not null default true,
  published boolean not null default true,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_announcements_title_len check (
    char_length(btrim(title)) >= 1
    and char_length(title) <= 120
  ),
  constraint social_announcements_body_len check (
    char_length(btrim(body)) >= 1
    and char_length(body) <= 4000
  )
);

create index if not exists social_announcements_feed_idx
  on public.social_announcements (published, pinned desc, created_at desc);

alter table public.social_announcements enable row level security;
alter table public.social_announcements force row level security;

create policy social_announcements_public_select
  on public.social_announcements
  for select
  to anon, authenticated
  using (published = true or (select private.is_admin()));

create policy social_announcements_admin_insert
  on public.social_announcements
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy social_announcements_admin_update
  on public.social_announcements
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy social_announcements_admin_delete
  on public.social_announcements
  for delete
  to authenticated
  using ((select private.is_admin()));

grant select on public.social_announcements to anon, authenticated;
grant insert, update, delete on public.social_announcements to authenticated;

comment on table public.social_announcements is
  'Pinned / published updates from Anikura developers for the Social tab.';
