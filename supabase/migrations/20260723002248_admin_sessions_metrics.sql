-- Night desk: first-class sessions (distinct analytics session_id)

drop function if exists public.admin_activity_series(integer);

create or replace function public.admin_activity_series(p_days integer default 30)
returns table (
  day date,
  page_views integer,
  sessions integer,
  watch_seconds bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  days integer := greatest(least(coalesce(p_days, 30), 90), 1);
begin
  if not private.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  with days as (
    select generate_series(
      (date_trunc('day', now())::date - (days - 1)),
      date_trunc('day', now())::date,
      '1 day'::interval
    )::date as day
  ),
  views as (
    select
      date_trunc('day', created_at)::date as day,
      count(*)::int as page_views,
      count(distinct case
        when session_id is not null and length(trim(session_id)) >= 8
        then trim(session_id)
      end)::int as sessions
    from public.analytics_events
    where event_type = 'page_view'
      and created_at >= date_trunc('day', now()) - make_interval(days => days - 1)
    group by 1
  ),
  watch as (
    select
      date_trunc('day', created_at)::date as day,
      coalesce(sum(seconds), 0)::bigint as watch_seconds
    from public.watch_time_ticks
    where created_at >= date_trunc('day', now()) - make_interval(days => days - 1)
    group by 1
  )
  select
    d.day,
    coalesce(v.page_views, 0)::int as page_views,
    coalesce(v.sessions, 0)::int as sessions,
    coalesce(w.watch_seconds, 0)::bigint as watch_seconds
  from days d
  left join views v on v.day = d.day
  left join watch w on w.day = d.day
  order by d.day;
end;
$$;

revoke all on function public.admin_activity_series(integer) from public, anon;
grant execute on function public.admin_activity_series(integer) to authenticated;

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
    'sessions_today', (
      select count(distinct session_id)::int
      from public.analytics_events
      where event_type = 'page_view'
        and created_at >= date_trunc('day', now())
        and session_id is not null
        and length(trim(session_id)) >= 8
    ),
    'sessions_7d', (
      select count(distinct session_id)::int
      from public.analytics_events
      where event_type = 'page_view'
        and created_at >= now() - interval '7 days'
        and session_id is not null
        and length(trim(session_id)) >= 8
    ),
    'sessions_30d', (
      select count(distinct session_id)::int
      from public.analytics_events
      where event_type = 'page_view'
        and created_at >= now() - interval '30 days'
        and session_id is not null
        and length(trim(session_id)) >= 8
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
