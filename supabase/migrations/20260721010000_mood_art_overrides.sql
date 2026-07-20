-- Admin-editable genre mood tile images (Supabase Storage + URL overrides)

create table if not exists public.mood_art (
  slug text primary key
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  image_url text not null
    check (char_length(trim(image_url)) > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists mood_art_updated_at_idx
  on public.mood_art (updated_at desc);

alter table public.mood_art enable row level security;
alter table public.mood_art force row level security;

-- Anyone can read override URLs (home / genres tiles)
create policy mood_art_public_select
  on public.mood_art
  for select
  to anon, authenticated
  using (true);

-- Only allowlisted admins can write
create policy mood_art_admin_insert
  on public.mood_art
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy mood_art_admin_update
  on public.mood_art
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy mood_art_admin_delete
  on public.mood_art
  for delete
  to authenticated
  using ((select private.is_admin()));

-- Public bucket for mood tile images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'moods',
  'moods',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket URLs serve files without a SELECT policy.
-- SELECT is admin-only so upsert (replace) works without exposing listing.
create policy moods_admin_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'moods'
    and (select private.is_admin())
  );

create policy moods_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'moods'
    and (select private.is_admin())
  );

create policy moods_admin_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'moods'
    and (select private.is_admin())
  )
  with check (
    bucket_id = 'moods'
    and (select private.is_admin())
  );

create policy moods_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'moods'
    and (select private.is_admin())
  );
