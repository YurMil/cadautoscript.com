-- Self-service account actions. All are SECURITY DEFINER so they can bypass the
-- (intentionally absent) DELETE policies on user_settings / user_utility_usage
-- and write to the append-only audit log, but each re-derives the caller from
-- auth.uid() and never trusts a client-supplied identity for the acting user.

-- Reset the caller's preferences to defaults by removing their settings row.
-- The client falls back to defaults when no row exists.
create or replace function public.reset_user_settings()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_name text;
  v_role text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select email, full_name, role into v_email, v_name, v_role
  from public.profiles where id = v_uid;

  delete from public.user_settings where user_id = v_uid;

  insert into public.admin_audit_log (
    event_type, actor_id, actor_email, actor_role,
    target_id, target_email, target_name, target_role
  )
  values (
    'settings_reset', v_uid, v_email, v_role,
    v_uid, v_email, v_name, v_role
  );
end;
$$;

-- Wipe the caller's personal usage analytics. Returns how many rows were removed.
create or replace function public.reset_user_analytics()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_name text;
  v_role text;
  v_deleted integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select email, full_name, role into v_email, v_name, v_role
  from public.profiles where id = v_uid;

  with removed as (
    delete from public.user_utility_usage where user_id = v_uid returning 1
  )
  select count(*) into v_deleted from removed;

  insert into public.admin_audit_log (
    event_type, actor_id, actor_email, actor_role,
    target_id, target_email, target_name, target_role, metadata
  )
  values (
    'analytics_reset', v_uid, v_email, v_role,
    v_uid, v_email, v_name, v_role,
    jsonb_build_object('deleted_count', v_deleted)
  );

  return v_deleted;
end;
$$;

-- Record an account deletion in the audit log BEFORE the auth user is removed,
-- snapshotting identity so the record survives the cascade. Does NOT delete the
-- user (that requires the service role and is done by the edge function).
-- Allowed for an admin deleting anyone, or a user deleting themselves.
create or replace function public.request_account_deletion(p_target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean := public.is_admin();
  v_actor_email text;
  v_actor_role text;
  v_target_email text;
  v_target_name text;
  v_target_role text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_target is null then
    raise exception 'target is required';
  end if;

  if not v_is_admin and p_target <> v_uid then
    raise exception 'Not authorized';
  end if;

  select email, role into v_actor_email, v_actor_role
  from public.profiles where id = v_uid;

  select email, full_name, role into v_target_email, v_target_name, v_target_role
  from public.profiles where id = p_target;

  insert into public.admin_audit_log (
    event_type, actor_id, actor_email, actor_role,
    target_id, target_email, target_name, target_role, metadata
  )
  values (
    'account_deleted', v_uid, v_actor_email, v_actor_role,
    p_target, v_target_email, v_target_name, v_target_role,
    jsonb_build_object('self_service', p_target = v_uid)
  );
end;
$$;

revoke execute on function public.reset_user_settings() from public, anon;
revoke execute on function public.reset_user_analytics() from public, anon;
revoke execute on function public.request_account_deletion(uuid) from public, anon;
grant execute on function public.reset_user_settings() to authenticated;
grant execute on function public.reset_user_analytics() to authenticated;
grant execute on function public.request_account_deletion(uuid) to authenticated;
