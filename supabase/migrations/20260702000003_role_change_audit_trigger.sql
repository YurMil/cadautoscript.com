-- Automatically log every role change on public.profiles into the audit log.
-- SECURITY DEFINER so the insert bypasses the audit table's (read-only) RLS.
-- The actor is the user performing the update (an admin, per the profiles
-- UPDATE policy); the target identity is taken from the row being changed.
create or replace function public.log_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_actor_email text;
  v_actor_role text;
begin
  if new.role is distinct from old.role then
    select email, role into v_actor_email, v_actor_role
    from public.profiles where id = v_uid;

    insert into public.admin_audit_log (
      event_type, actor_id, actor_email, actor_role,
      target_id, target_email, target_name, target_role, metadata
    )
    values (
      'role_changed', v_uid, v_actor_email, v_actor_role,
      new.id, new.email, new.full_name, new.role,
      jsonb_build_object('from', old.role, 'to', new.role)
    );
  end if;

  return new;
end;
$$;

-- Trigger functions fire with the table owner's privileges regardless of
-- grants, so it must NOT be exposed as a callable PostgREST RPC.
revoke execute on function public.log_role_change() from public, anon, authenticated;

drop trigger if exists trg_log_role_change on public.profiles;
create trigger trg_log_role_change
  after update of role on public.profiles
  for each row
  execute function public.log_role_change();
