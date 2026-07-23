-- Allow Admin + Mod staff badges on profiles
alter table public.profiles
  drop constraint if exists profiles_badges_allowed;

alter table public.profiles
  add constraint profiles_badges_allowed
  check (
    badges <@ array['admin', 'mod', 'dev', 'vip', 'og', 'partner']::text[]
  );

comment on column public.profiles.badges is
  'Public profile badge ids shown next to display name (admin, mod, og, partner, dev, vip).';
