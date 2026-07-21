-- Allow OG badge on profiles
alter table public.profiles
  drop constraint if exists profiles_badges_allowed;

alter table public.profiles
  add constraint profiles_badges_allowed
  check (
    badges <@ array['dev', 'vip', 'og']::text[]
  );

comment on column public.profiles.badges is
  'Public profile badge ids shown next to display name (e.g. dev, vip, og).';
