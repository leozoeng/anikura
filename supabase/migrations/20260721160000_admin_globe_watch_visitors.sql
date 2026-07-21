-- Admin desk: watch-time ticks, visitor metrics, enriched live presence

create table if not exists public.watch_time_ticks (
  id bigint generated always as identity primary key,
  session_id text,
  user_id uuid references auth.users (id) on delete set null,
  path text,
  seconds integer not null check (seconds > 0 and seconds <= 180),
  created_at timestamptz not null default now()
);

create index if not exists watch_time_ticks_created_at_idx
  on public.watch_time_ticks (created_at desc);
create index if not exists watch_time_ticks_session_idx
  on public.watch_time_ticks (session_id, created_at desc);

alter table public.watch_time_ticks enable row level security;
alter table public.watch_time_ticks force row level security;

drop policy if exists watch_time_admin_select on public.watch_time_ticks;
create policy watch_time_admin_select
  on public.watch_time_ticks
  for select
  to authenticated
  using ((select public.is_admin()));

create or replace function public.track_watch_time(
  p_session_id text,
  p_seconds integer,
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
  if p_seconds is null or p_seconds < 1 or p_seconds > 180 then
    raise exception 'invalid seconds';
  end if;

  insert into public.watch_time_ticks (session_id, user_id, path, seconds)
  values (
    left(trim(p_session_id), 64),
    auth.uid(),
    left(nullif(trim(p_path), ''), 256),
    p_seconds
  );
end;
$$;

revoke all on function public.track_watch_time(text, integer, text) from public;
grant execute on function public.track_watch_time(text, integer, text) to anon, authenticated;

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
    'live_users', (
      select count(*)::int from public.presence
      where last_seen > now() - make_interval(secs => greatest(p_live_seconds, 30))
    ),
    'total_signups', (select count(*)::int from public.profiles),
    'signups_today', (
      select count(*)::int from public.profiles
      where created_at >= date_trunc('day', now())
    ),
    'signups_7d', (
      select count(*)::int from public.profiles
      where created_at >= now() - interval '7 days'
    ),
    'page_views_today', (
      select count(*)::int from public.analytics_events
      where event_type = 'page_view'
        and created_at >= date_trunc('day', now())
    ),
    'page_views_7d', (
      select count(*)::int from public.analytics_events
      where event_type = 'page_view'
        and created_at >= now() - interval '7 days'
    ),
    'sessions_live', (
      select count(*)::int from public.presence
      where last_seen > now() - make_interval(secs => greatest(p_live_seconds, 30))
    ),
    'unique_visitors_today', (
      select count(distinct session_id)::int
      from public.analytics_events
      where event_type = 'page_view'
        and created_at >= date_trunc('day', now())
        and session_id is not null
        and length(trim(session_id)) >= 8
    ),
    'returning_visitors_today', (
      select count(distinct t.session_id)::int
      from public.analytics_events t
      where t.event_type = 'page_view'
        and t.created_at >= date_trunc('day', now())
        and t.session_id is not null
        and length(trim(t.session_id)) >= 8
        and exists (
          select 1
          from public.analytics_events earlier
          where earlier.event_type = 'page_view'
            and earlier.session_id = t.session_id
            and earlier.created_at < date_trunc('day', now())
        )
    ),
    'watch_seconds_today', (
      select coalesce(sum(seconds), 0)::bigint
      from public.watch_time_ticks
      where created_at >= date_trunc('day', now())
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_metrics(integer) from public, anon;
grant execute on function public.admin_dashboard_metrics(integer) to authenticated;

drop function if exists public.admin_live_presence(integer);

create or replace function public.admin_live_presence(p_live_seconds integer default 120)
returns table (
  id uuid,
  session_id text,
  user_id uuid,
  email text,
  nickname text,
  lat double precision,
  lng double precision,
  country text,
  city text,
  path text,
  last_seen timestamptz
)
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
  select
    pr.id,
    pr.session_id,
    pr.user_id,
    p.email,
    p.nickname,
    pr.lat,
    pr.lng,
    pr.country,
    pr.city,
    pr.path,
    pr.last_seen
  from public.presence pr
  left join public.profiles p on p.id = pr.user_id
  where pr.last_seen > now() - make_interval(secs => greatest(p_live_seconds, 30))
    and pr.lat is not null
    and pr.lng is not null
  order by pr.last_seen desc
  limit 2000;
end;
$$;

revoke all on function public.admin_live_presence(integer) from public, anon;
grant execute on function public.admin_live_presence(integer) to authenticated;
