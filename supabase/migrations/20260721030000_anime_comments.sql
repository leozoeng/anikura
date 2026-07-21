-- Anime series comments (public read, authenticated write own)

create table if not exists public.anime_comments (
  id uuid primary key default gen_random_uuid(),
  anime_id integer not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anime_comments_body_length check (
    char_length(btrim(body)) >= 1
    and char_length(body) <= 2000
  )
);

create index if not exists anime_comments_anime_created_idx
  on public.anime_comments (anime_id, created_at desc);

create index if not exists anime_comments_user_id_idx
  on public.anime_comments (user_id);

alter table public.anime_comments enable row level security;
alter table public.anime_comments force row level security;

create policy anime_comments_select
  on public.anime_comments
  for select
  to anon, authenticated
  using (true);

create policy anime_comments_insert_own
  on public.anime_comments
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy anime_comments_delete_own
  on public.anime_comments
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy anime_comments_delete_admin
  on public.anime_comments
  for delete
  to authenticated
  using ((select private.is_admin()));

grant select on public.anime_comments to anon, authenticated;
grant insert, delete on public.anime_comments to authenticated;
