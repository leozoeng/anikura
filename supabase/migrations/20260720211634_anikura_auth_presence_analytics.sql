-- Anikura: profiles, presence, analytics + RLS
-- Applied remotely to project yotvmnkhxqdztuqnvzpq

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_created_at_idx on public.profiles (created_at desc);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin();
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_admin_update
  on public.profiles
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create table public.presence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  session_id text not null,
  lat double precision,
  lng double precision,
  country text,
  city text,
  path text,
  last_seen timestamptz not null default now(),
  constraint presence_session_id_key unique (session_id)
);

create index presence_last_seen_idx on public.presence (last_seen desc);
create index presence_user_id_idx on public.presence (user_id);
create index presence_live_geo_idx on public.presence (last_seen desc)
  where lat is not null and lng is not null;

alter table public.presence enable row level security;
alter table public.presence force row level security;

create policy presence_admin_select
  on public.presence
  for select
  to authenticated
  using ((select public.is_admin()));

create or replace function public.upsert_presence(
  p_session_id text,
  p_lat double precision default null,
  p_lng double precision default null,
  p_country text default null,
  p_city text default null,
  p_path text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_session_id is null or length(trim(p_session_id)) < 8 then
    raise exception 'invalid session_id';
  end if;

  insert into public.presence as pr (
    session_id, user_id, lat, lng, country, city, path, last_seen
  )
  values (
    left(trim(p_session_id), 64),
    auth.uid(),
    p_lat, p_lng,
    left(nullif(trim(p_country), ''), 64),
    left(nullif(trim(p_city), ''), 96),
    left(nullif(trim(p_path), ''), 256),
    now()
  )
  on conflict (session_id) do update set
    user_id = coalesce(excluded.user_id, pr.user_id),
    lat = coalesce(excluded.lat, pr.lat),
    lng = coalesce(excluded.lng, pr.lng),
    country = coalesce(excluded.country, pr.country),
    city = coalesce(excluded.city, pr.city),
    path = coalesce(excluded.path, pr.path),
    last_seen = now();

  delete from public.presence where last_seen < now() - interval '5 minutes';
end;
$$;

revoke all on function public.upsert_presence(text, double precision, double precision, text, text, text) from public;
grant execute on function public.upsert_presence(text, double precision, double precision, text, text, text) to anon, authenticated;

create or replace function public.cleanup_stale_presence()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare deleted_count integer;
begin
  delete from public.presence where last_seen < now() - interval '5 minutes';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.cleanup_stale_presence() from public, anon;
grant execute on function public.cleanup_stale_presence() to authenticated;

create table public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null default 'page_view',
  path text,
  session_id text,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index analytics_events_type_created_idx on public.analytics_events (event_type, created_at desc);
create index analytics_events_user_id_idx on public.analytics_events (user_id);

alter table public.analytics_events enable row level security;
alter table public.analytics_events force row level security;

create policy analytics_admin_select
  on public.analytics_events
  for select
  to authenticated
  using ((select public.is_admin()));

create or replace function public.track_event(
  p_event_type text default 'page_view',
  p_path text default null,
  p_session_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.analytics_events (event_type, path, session_id, user_id)
  values (
    left(coalesce(nullif(trim(p_event_type), ''), 'page_view'), 64),
    left(nullif(trim(p_path), ''), 256),
    left(nullif(trim(p_session_id), ''), 64),
    auth.uid()
  );
end;
$$;

revoke all on function public.track_event(text, text, text) from public;
grant execute on function public.track_event(text, text, text) to anon, authenticated;

create or replace function public.admin_dashboard_metrics(p_live_seconds integer default 120)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if not private.is_admin() then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'live_users', (select count(*)::int from public.presence where last_seen > now() - make_interval(secs => greatest(p_live_seconds, 30))),
    'total_signups', (select count(*)::int from public.profiles),
    'signups_today', (select count(*)::int from public.profiles where created_at >= date_trunc('day', now())),
    'signups_7d', (select count(*)::int from public.profiles where created_at >= now() - interval '7 days'),
    'page_views_today', (select count(*)::int from public.analytics_events where event_type = 'page_view' and created_at >= date_trunc('day', now())),
    'page_views_7d', (select count(*)::int from public.analytics_events where event_type = 'page_view' and created_at >= now() - interval '7 days'),
    'sessions_live', (select count(*)::int from public.presence where last_seen > now() - make_interval(secs => greatest(p_live_seconds, 30)))
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_metrics(integer) from public, anon;
grant execute on function public.admin_dashboard_metrics(integer) to authenticated;

create or replace function public.admin_live_presence(p_live_seconds integer default 120)
returns setof public.presence
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select *
  from public.presence
  where last_seen > now() - make_interval(secs => greatest(p_live_seconds, 30))
    and lat is not null and lng is not null
  order by last_seen desc
  limit 2000;
end;
$$;

revoke all on function public.admin_live_presence(integer) from public, anon;
grant execute on function public.admin_live_presence(integer) to authenticated;

create or replace function public.admin_signup_series(p_days integer default 14)
returns table (day date, signups integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  with days as (
    select generate_series(
      (current_date - (greatest(p_days, 1) - 1)),
      current_date,
      interval '1 day'
    )::date as day
  )
  select d.day, coalesce(count(p.id), 0)::int as signups
  from days d
  left join public.profiles p on p.created_at::date = d.day
  group by d.day
  order by d.day;
end;
$$;

revoke all on function public.admin_signup_series(integer) from public, anon;
grant execute on function public.admin_signup_series(integer) to authenticated;

create or replace function private.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    if not private.is_admin() then
      raise exception 'cannot change role';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_profile_role
  before update on public.profiles
  for each row execute function private.protect_profile_role();

-- Admin email allowlist (mirrors ADMIN_EMAIL for RLS / RPCs)
create table if not exists private.admin_allowlist (
  email text primary key
);

-- Seed your admin email here (example):
-- insert into private.admin_allowlist (email) values (lower('you@example.com')) on conflict do nothing;
