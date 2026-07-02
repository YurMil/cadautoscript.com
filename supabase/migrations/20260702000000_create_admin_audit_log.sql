-- Append-only audit log for important account/admin events.
--
-- Deliberately has NO foreign key to auth.users / public.profiles: rows must
-- survive the deletion of the user they describe, otherwise the record of
-- "who deleted this account" would be cascade-deleted along with it. Identity
-- is therefore snapshotted into text columns at write time.
--
-- Writes happen exclusively through SECURITY DEFINER functions (see later
-- migrations); there are no INSERT/UPDATE/DELETE policies, so authenticated
-- clients cannot forge or tamper with entries. Only admins may read.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
    event_type in (
      'account_deleted',
      'settings_reset',
      'analytics_reset',
      'role_changed',
      'user_invited'
    )
  ),
  actor_id uuid,
  actor_email text,
  actor_role text,
  target_id uuid,
  target_email text,
  target_name text,
  target_role text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_event_type_idx
  on public.admin_audit_log (event_type);

alter table public.admin_audit_log enable row level security;

-- Admins can read the log; nobody can write to it directly.
drop policy if exists "Admins can read audit log" on public.admin_audit_log;
create policy "Admins can read audit log"
  on public.admin_audit_log
  for select
  to authenticated
  using (public.is_admin());

revoke all on public.admin_audit_log from public;
revoke all on public.admin_audit_log from anon;
revoke all on public.admin_audit_log from authenticated;
grant select on public.admin_audit_log to authenticated;
