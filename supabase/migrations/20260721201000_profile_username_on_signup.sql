-- Append signup handler so new accounts get a unique vanity username
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := private.normalize_username(split_part(coalesce(new.email, ''), '@', 1));
  if base is null or private.is_reserved_username(base) then
    base := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  candidate := base;
  while exists (select 1 from public.profiles p where p.username = candidate)
     or private.is_reserved_username(candidate) loop
    n := n + 1;
    candidate := left(base, greatest(3, 24 - length(n::text) - 1)) || n::text;
    if n > 9999 then
      candidate := 'u' || substr(replace(new.id::text, '-', ''), 1, 12);
      exit;
    end if;
  end loop;

  insert into public.profiles (id, email, role, nickname, username)
  values (new.id, new.email, 'user', split_part(coalesce(new.email, ''), '@', 1), candidate)
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username),
    nickname = coalesce(nullif(public.profiles.nickname, ''), excluded.nickname);
  return new;
end;
$$;
