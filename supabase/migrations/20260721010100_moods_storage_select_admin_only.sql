-- Tighten moods bucket SELECT: public buckets serve via URL; SELECT is for admin upsert only.

drop policy if exists moods_public_read on storage.objects;

drop policy if exists moods_admin_select on storage.objects;

create policy moods_admin_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'moods'
    and (select private.is_admin())
  );
