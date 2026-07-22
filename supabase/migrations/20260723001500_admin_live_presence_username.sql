-- Night desk: include username on live presence for clearer visitor identity.

create or replace function public.admin_live_presence(p_live_seconds integer default 120)
returns table (
  id uuid,
  session_id text,
  user_id uuid,
  email text,
  nickname text,
  username text,
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
#variable_conflict use_column
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
    p.username,
    pr.lat,
    pr.lng,
    pr.country,
    pr.city,
    pr.path,
    pr.last_seen
  from public.presence pr
  left join public.profiles p on p.id = pr.user_id
  where pr.last_seen > now() - make_interval(secs => greatest(p_live_seconds, 30))
  order by pr.last_seen desc
  limit 2000;
end;
$$;

revoke all on function public.admin_live_presence(integer) from public, anon;
grant execute on function public.admin_live_presence(integer) to authenticated;
