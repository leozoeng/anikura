-- YouTube-style comments: replies + likes

alter table public.anime_comments
  add column if not exists parent_id uuid references public.anime_comments (id) on delete cascade;

create index if not exists anime_comments_parent_id_idx
  on public.anime_comments (parent_id);

create table if not exists public.anime_comment_likes (
  comment_id uuid not null references public.anime_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists anime_comment_likes_user_id_idx
  on public.anime_comment_likes (user_id);

alter table public.anime_comment_likes enable row level security;
alter table public.anime_comment_likes force row level security;

create policy anime_comment_likes_select
  on public.anime_comment_likes
  for select
  to anon, authenticated
  using (true);

create policy anime_comment_likes_insert_own
  on public.anime_comment_likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy anime_comment_likes_delete_own
  on public.anime_comment_likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select on public.anime_comment_likes to anon, authenticated;
grant insert, delete on public.anime_comment_likes to authenticated;
