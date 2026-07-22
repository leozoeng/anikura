-- Night desk: daily page-view + watch-time series for sparklines / ranges

create or replace function public.admin_activity_series(p_days integer default 30)
returns table (
  day date,
  page_views integer,
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
      count(*)::int as page_views
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
    coalesce(w.watch_seconds, 0)::bigint as watch_seconds
  from days d
  left join views v on v.day = d.day
  left join watch w on w.day = d.day
  order by d.day;
end;
$$;

revoke all on function public.admin_activity_series(integer) from public, anon;
grant execute on function public.admin_activity_series(integer) to authenticated;
