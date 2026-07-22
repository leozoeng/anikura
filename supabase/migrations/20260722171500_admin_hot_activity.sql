-- Night desk: top pages + most-watched paths for today

create or replace function public.admin_hot_activity(p_limit integer default 8)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
  lim integer := greatest(coalesce(p_limit, 8), 1);
begin
  if not private.is_admin() then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'top_pages', coalesce((
      select jsonb_agg(
        jsonb_build_object('path', t.path, 'views', t.views)
        order by t.views desc
      )
      from (
        select
          coalesce(nullif(trim(path), ''), '/') as path,
          count(*)::int as views
        from public.analytics_events
        where event_type = 'page_view'
          and created_at >= date_trunc('day', now())
        group by 1
        order by views desc
        limit lim
      ) t
    ), '[]'::jsonb),
    'top_watched', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'path', t.path,
          'seconds', t.seconds,
          'sessions', t.sessions
        )
        order by t.seconds desc
      )
      from (
        select
          coalesce(nullif(trim(path), ''), '/watch') as path,
          sum(seconds)::bigint as seconds,
          count(distinct nullif(trim(session_id), ''))::int as sessions
        from public.watch_time_ticks
        where created_at >= date_trunc('day', now())
          and path is not null
          and path like '/watch/%'
        group by 1
        order by seconds desc
        limit lim
      ) t
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_hot_activity(integer) from public, anon;
grant execute on function public.admin_hot_activity(integer) to authenticated;
