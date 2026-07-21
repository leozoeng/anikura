-- Drop VIP from leozoeng; keep Dev only.
-- Bypass protect_profile_badges (requires is_admin() for badge writes).
alter table public.profiles disable trigger protect_profile_badges;

update public.profiles
set badges = array(
  select distinct b
  from unnest(coalesce(badges, '{}'::text[])) as b
  where b is distinct from 'vip'
)
where lower(coalesce(email, '')) = lower('leozoeng@icloud.com');

alter table public.profiles enable trigger protect_profile_badges;
