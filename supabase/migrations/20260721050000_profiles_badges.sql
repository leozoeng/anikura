-- Discord-style profile badges (dev, vip, …)

alter table public.profiles
  add column if not exists badges text[] not null default '{}';

alter table public.profiles
  drop constraint if exists profiles_badges_allowed;

alter table public.profiles
  add constraint profiles_badges_allowed
  check (
    badges <@ array['dev', 'vip']::text[]
  );

comment on column public.profiles.badges is
  'Public profile badge ids shown next to display name (e.g. dev, vip).';

-- Seed known staff / VIP emails
update public.profiles
set badges = (
  select array_agg(distinct b order by b)
  from unnest(coalesce(badges, '{}'::text[]) || array['dev', 'vip']::text[]) as b
)
where lower(coalesce(email, '')) = lower('leozoeng@icloud.com');

-- Prevent users from granting themselves badges (mirrors role protection)
create or replace function private.protect_profile_badges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.badges is distinct from old.badges then
    if not private.is_admin() then
      raise exception 'cannot change badges';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_badges on public.profiles;
create trigger protect_profile_badges
  before update on public.profiles
  for each row execute function private.protect_profile_badges();
