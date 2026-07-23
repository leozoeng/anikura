-- Capture device class from presence heartbeats for Night desk Globe mix.

alter table public.presence
  add column if not exists device text;

alter table public.presence
  add column if not exists user_agent text;

comment on column public.presence.device is
  'Classified client: desktop | ios | android | other';

drop function if exists public.upsert_presence(text, double precision, double precision, text, text, text);

create or replace function public.upsert_presence(
  p_session_id text,
  p_lat double precision default null,
  p_lng double precision default null,
  p_country text default null,
  p_city text default null,
  p_path text default null,
  p_device text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_device text;
begin
  if p_session_id is null or length(trim(p_session_id)) < 8 then
    raise exception 'invalid session_id';
  end if;

  v_device := lower(nullif(trim(p_device), ''));
  if v_device is not null
     and v_device not in ('desktop', 'ios', 'android', 'other') then
    v_device := 'other';
  end if;

  insert into public.presence as pr (
    session_id, user_id, lat, lng, country, city, path,
    device, user_agent, first_seen, last_seen
  )
  values (
    left(trim(p_session_id), 64),
    auth.uid(),
    p_lat, p_lng,
    left(nullif(trim(p_country), ''), 64),
    left(nullif(trim(p_city), ''), 96),
    left(nullif(trim(p_path), ''), 256),
    v_device,
    left(nullif(trim(p_user_agent), ''), 512),
    now(),
    now()
  )
  on conflict (session_id) do update set
    user_id = coalesce(excluded.user_id, pr.user_id),
    lat = coalesce(excluded.lat, pr.lat),
    lng = coalesce(excluded.lng, pr.lng),
    country = coalesce(excluded.country, pr.country),
    city = coalesce(excluded.city, pr.city),
    path = coalesce(excluded.path, pr.path),
    device = coalesce(excluded.device, pr.device),
    user_agent = coalesce(excluded.user_agent, pr.user_agent),
    last_seen = now();

  delete from public.presence where last_seen < now() - interval '5 minutes';
end;
$$;

revoke all on function public.upsert_presence(text, double precision, double precision, text, text, text, text, text) from public;
grant execute on function public.upsert_presence(text, double precision, double precision, text, text, text, text, text) to anon, authenticated;

drop function if exists public.admin_live_presence(integer);

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
  device text,
  user_agent text,
  first_seen timestamptz,
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
    pr.device,
    pr.user_agent,
    pr.first_seen,
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
