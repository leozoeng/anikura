-- Admin access is email-allowlist only.
-- profiles.role = 'admin' alone is not enough for private.is_admin().

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join private.admin_allowlist a
      on a.email = lower(coalesce(p.email, ''))
    where p.id = (select auth.uid())
  );
$$;

-- Sole admin
delete from private.admin_allowlist
where email is distinct from lower('leozoeng@icloud.com');

insert into private.admin_allowlist (email)
values (lower('leozoeng@icloud.com'))
on conflict do nothing;

update public.profiles
set role = 'user'
where lower(coalesce(email, '')) is distinct from lower('leozoeng@icloud.com');

update public.profiles
set role = 'admin'
where lower(coalesce(email, '')) = lower('leozoeng@icloud.com');
