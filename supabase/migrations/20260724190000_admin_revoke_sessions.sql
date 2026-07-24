-- Allow admins to revoke Auth refresh sessions for a user (force sign-out).

create or replace function private.admin_revoke_auth_sessions(target uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_sessions int := 0;
begin
  if target is null then
    return 0;
  end if;

  delete from auth.refresh_tokens where user_id = target;
  delete from auth.sessions where user_id = target;
  get diagnostics deleted_sessions = row_count;
  return deleted_sessions;
end;
$$;

revoke all on function private.admin_revoke_auth_sessions(uuid) from public;

create or replace function public.admin_revoke_auth_sessions(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'admin only';
  end if;
  return private.admin_revoke_auth_sessions(p_user_id);
end;
$$;

revoke all on function public.admin_revoke_auth_sessions(uuid) from public, anon;
grant execute on function public.admin_revoke_auth_sessions(uuid) to authenticated;

comment on function public.admin_revoke_auth_sessions(uuid) is
  'Admin-only: wipe auth.sessions + refresh_tokens so the user must sign in again.';
