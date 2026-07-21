-- Unique vanity usernames for public profiles

alter table public.profiles
  add column if not exists username text;

comment on column public.profiles.username is
  'Unique vanity handle (lowercase a-z 0-9 _), claimed by the user.';

-- Normalize + validate format
create or replace function private.normalize_username(raw text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  cleaned text;
begin
  if raw is null then
    return null;
  end if;
  cleaned := lower(trim(raw));
  cleaned := regexp_replace(cleaned, '^@+', '');
  cleaned := regexp_replace(cleaned, '[^a-z0-9_]', '', 'g');
  if length(cleaned) < 3 or length(cleaned) > 24 then
    return null;
  end if;
  if cleaned !~ '^[a-z0-9_]+$' then
    return null;
  end if;
  return cleaned;
end;
$$;

create or replace function private.is_reserved_username(handle text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select handle in (
    'admin', 'administrator', 'anikura', 'api', 'auth', 'browse', 'callback',
    'discord', 'genres', 'ghibli', 'help', 'home', 'login', 'logout', 'me',
    'mod', 'moderator', 'null', 'official', 'owner', 'profile', 'profiles',
    'root', 'search', 'settings', 'signup', 'staff', 'support', 'system',
    'undefined', 'u', 'user', 'users', 'watch', 'www'
  );
$$;

create or replace function private.ensure_username_ok()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text;
begin
  if new.username is null or btrim(new.username) = '' then
    new.username := null;
    return new;
  end if;

  normalized := private.normalize_username(new.username);
  if normalized is null then
    raise exception 'Username must be 3–24 characters: letters, numbers, underscore';
  end if;
  if private.is_reserved_username(normalized) then
    raise exception 'That username is reserved';
  end if;
  new.username := normalized;
  return new;
end;
$$;

drop trigger if exists ensure_username_ok on public.profiles;
create trigger ensure_username_ok
  before insert or update of username on public.profiles
  for each row execute function private.ensure_username_ok();

-- Case-insensitive uniqueness (username already stored lowercase)
create unique index if not exists profiles_username_unique_idx
  on public.profiles (username)
  where username is not null;

-- Backfill unique usernames from nickname / email local-part
do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in
    select id, nickname, email
    from public.profiles
    where username is null
    order by created_at asc
  loop
    base := private.normalize_username(
      coalesce(nullif(r.nickname, ''), split_part(coalesce(r.email, ''), '@', 1), 'viewer')
    );
    if base is null or private.is_reserved_username(base) then
      base := 'user' || substr(replace(r.id::text, '-', ''), 1, 8);
    end if;

    candidate := base;
    n := 0;
    while exists (
      select 1 from public.profiles p where p.username = candidate
    ) or private.is_reserved_username(candidate) loop
      n := n + 1;
      candidate := left(base, greatest(3, 24 - length(n::text) - 1)) || n::text;
      if n > 9999 then
        candidate := 'u' || substr(replace(r.id::text, '-', ''), 1, 12);
        exit;
      end if;
    end loop;

    update public.profiles set username = candidate where id = r.id;
  end loop;
end;
$$;

-- Public search for profiles (username / nickname)
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
      when p.username = q then 0
      when p.username like q || '%' then 1
      else 2
    end,
    p.created_at asc
  limit take;
end;
$$;

revoke all on function public.search_profiles(text, integer) from public;
grant execute on function public.search_profiles(text, integer) to anon, authenticated;

-- Availability check for edit UI
create or replace function public.username_available(p_username text, p_user_id uuid default null)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized text := private.normalize_username(p_username);
begin
  if normalized is null then
    return false;
  end if;
  if private.is_reserved_username(normalized) then
    return false;
  end if;
  return not exists (
    select 1
    from public.profiles p
    where p.username = normalized
      and (p_user_id is null or p.id <> p_user_id)
  );
end;
$$;

revoke all on function public.username_available(text, uuid) from public;
grant execute on function public.username_available(text, uuid) to anon, authenticated;
