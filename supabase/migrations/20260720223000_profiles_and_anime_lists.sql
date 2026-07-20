-- Profiles identity + anime list statuses + storage (applied remotely)

alter table public.profiles
  add column if not exists nickname text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists banner_url text;

update public.profiles
set nickname = coalesce(nickname, split_part(email, '@', 1))
where nickname is null;

create table if not exists public.anime_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  anime_id integer not null,
  slug text not null,
  title text not null,
  poster text not null default '',
  status text not null default 'planned'
    check (status in ('watching', 'completed', 'planned', 'dropped', 'on_hold')),
  is_favorite boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, anime_id)
);

create index if not exists anime_list_user_status_idx
  on public.anime_list (user_id, status, updated_at desc);
create index if not exists anime_list_user_fav_idx
  on public.anime_list (user_id, is_favorite)
  where is_favorite = true;

alter table public.anime_list enable row level security;
alter table public.anime_list force row level security;
