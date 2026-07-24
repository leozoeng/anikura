-- Profile activity visibility + synced continue-watching for public Activity tab

alter table public.profiles
  add column if not exists activity_public boolean not null default false;

create table if not exists public.watch_activity (
  user_id uuid not null references public.profiles (id) on delete cascade,
  anime_id bigint not null,
  slug text not null,
  title text not null,
  poster text,
  episode integer not null check (episode > 0),
  language text not null default 'sub' check (language in ('sub', 'dub')),
  percent integer not null default 0 check (percent >= 0 and percent <= 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, anime_id)
);

create index if not exists watch_activity_user_updated_idx
  on public.watch_activity (user_id, updated_at desc);

alter table public.watch_activity enable row level security;
alter table public.watch_activity force row level security;

drop policy if exists watch_activity_select on public.watch_activity;
create policy watch_activity_select
  on public.watch_activity
  for select
  to authenticated, anon
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles p
      where p.id = watch_activity.user_id
        and p.activity_public = true
    )
  );

drop policy if exists watch_activity_insert_own on public.watch_activity;
create policy watch_activity_insert_own
  on public.watch_activity
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists watch_activity_update_own on public.watch_activity;
create policy watch_activity_update_own
  on public.watch_activity
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists watch_activity_delete_own on public.watch_activity;
create policy watch_activity_delete_own
  on public.watch_activity
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.watch_activity to anon, authenticated;
grant insert, update, delete on public.watch_activity to authenticated;
