-- Rank Find people / Suggested by how complete the profile looks
-- (avatar + banner first), so Social rail shows fuller profiles at the top.

create or replace function public.suggest_profiles(
  p_limit integer default 8,
  p_exclude uuid default null
)
returns table (
  id uuid,
  username text,
  nickname text,
  avatar_url text,
  bio text,
  badges text[],
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  take int := least(greatest(coalesce(p_limit, 8), 1), 16);
begin
  return query
  select
    p.id,
    p.username,
    p.nickname,
    p.avatar_url,
    p.bio,
    p.badges,
    p.created_at
  from public.profiles p
  where
    (p_exclude is null or p.id <> p_exclude)
    and (
      p.username is not null
      or coalesce(p.nickname, '') <> ''
      or coalesce(cardinality(p.badges), 0) > 0
      or coalesce(nullif(trim(p.avatar_url), ''), '') <> ''
      or coalesce(nullif(trim(p.banner_url), ''), '') <> ''
    )
  order by
    case
      when coalesce(nullif(trim(p.avatar_url), ''), '') <> ''
        and coalesce(nullif(trim(p.banner_url), ''), '') <> '' then 0
      when coalesce(nullif(trim(p.avatar_url), ''), '') <> '' then 1
      when coalesce(nullif(trim(p.banner_url), ''), '') <> '' then 2
      when coalesce(cardinality(p.badges), 0) > 0 then 3
      when p.username is not null then 4
      else 5
    end,
    p.created_at desc
  limit take;
end;
$$;

revoke all on function public.suggest_profiles(integer, uuid) from public;
grant execute on function public.suggest_profiles(integer, uuid) to anon, authenticated;

comment on function public.suggest_profiles(integer, uuid) is
  'Public profile suggestions for Find people. Prefers avatar+banner, then avatar, then badges. Never returns email.';

create or replace function public.search_profiles(p_query text, p_limit integer default 12)
returns table (
  id uuid,
  username text,
  nickname text,
  avatar_url text,
  bio text,
  badges text[],
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  q text := lower(trim(coalesce(p_query, '')));
  take int := least(greatest(coalesce(p_limit, 12), 1), 24);
begin
  if length(q) < 1 then
    return;
  end if;
  q := regexp_replace(q, '^@+', '');

  return query
  select
    p.id,
    p.username,
    p.nickname,
    p.avatar_url,
    p.bio,
    p.badges,
    p.created_at
  from public.profiles p
  where
    p.username ilike q || '%'
    or p.username ilike '%' || q || '%'
    or coalesce(p.nickname, '') ilike '%' || q || '%'
  order by
    case
      when lower(p.username) = q then 0
      when p.username ilike q || '%' then 1
      else 2
    end,
    case
      when coalesce(nullif(trim(p.avatar_url), ''), '') <> ''
        and coalesce(nullif(trim(p.banner_url), ''), '') <> '' then 0
      when coalesce(nullif(trim(p.avatar_url), ''), '') <> '' then 1
      when coalesce(nullif(trim(p.banner_url), ''), '') <> '' then 2
      else 3
    end,
    p.created_at asc
  limit take;
end;
$$;

revoke all on function public.search_profiles(text, integer) from public;
grant execute on function public.search_profiles(text, integer) to anon, authenticated;

comment on function public.search_profiles(text, integer) is
  'Username/nickname search. Match quality first, then avatar+banner completeness.';
