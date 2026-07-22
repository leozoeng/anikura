-- Suggested people for Social Find-people rail (no email exposed)

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
    )
  order by
    case
      when coalesce(cardinality(p.badges), 0) > 0 then 0
      when p.username is not null then 1
      else 2
    end,
    p.created_at desc
  limit take;
end;
$$;

revoke all on function public.suggest_profiles(integer, uuid) from public;
grant execute on function public.suggest_profiles(integer, uuid) to anon, authenticated;

comment on function public.suggest_profiles(integer, uuid) is
  'Public profile suggestions for Find people (recent / badged). Never returns email.';
