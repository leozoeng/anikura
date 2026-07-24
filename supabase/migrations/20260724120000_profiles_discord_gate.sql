-- Gate site access behind Discord membership (verified server-side).

alter table public.profiles
  add column if not exists discord_id text,
  add column if not exists discord_verified_at timestamptz;

create unique index if not exists profiles_discord_id_uidx
  on public.profiles (discord_id)
  where discord_id is not null;

comment on column public.profiles.discord_id is
  'Discord snowflake linked via OAuth. Set only by service role / verify API.';
comment on column public.profiles.discord_verified_at is
  'When Discord guild membership was last confirmed. Null = not cleared for the site.';

-- Users must not self-grant Discord verification.
create or replace function private.protect_profile_discord()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.discord_id is distinct from old.discord_id
      or new.discord_verified_at is distinct from old.discord_verified_at then
      -- Service role (verify API) and allowlisted admins may write these fields.
      if auth.role() is distinct from 'service_role' and not private.is_admin() then
        raise exception 'cannot change discord verification fields';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_discord on public.profiles;
create trigger protect_profile_discord
  before update on public.profiles
  for each row execute function private.protect_profile_discord();
