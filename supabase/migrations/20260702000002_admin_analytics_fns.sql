-- Admin-only read/aggregation functions for the dashboard. All guarded by
-- is_admin() and SECURITY DEFINER so they can read across all users past RLS.

-- Paginated audit log, newest first, with optional event-type filter.
create or replace function public.get_admin_audit_log(
  p_limit integer default 100,
  p_offset integer default 0,
  p_event_type text default null
)
returns table (
  id uuid,
  event_type text,
  actor_id uuid,
  actor_email text,
  actor_role text,
  target_id uuid,
  target_email text,
  target_name text,
  target_role text,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select
      l.id, l.event_type, l.actor_id, l.actor_email, l.actor_role,
      l.target_id, l.target_email, l.target_name, l.target_role,
      l.metadata, l.created_at
    from public.admin_audit_log l
    where p_event_type is null or l.event_type = p_event_type
    order by l.created_at desc
    limit greatest(1, least(coalesce(p_limit, 100), 500))
    offset greatest(0, coalesce(p_offset, 0));
end;
$$;

-- One-shot dashboard summary: user counts, activity, deletions and the
-- distribution of key preferences. Returns a single jsonb object.
create or replace function public.get_admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select jsonb_build_object(
    'total_users', (select count(*) from public.profiles),
    'new_users_7d', (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'new_users_30d', (select count(*) from public.profiles where created_at >= now() - interval '30 days'),
    'active_users_7d', (select count(*) from public.profiles where last_seen_at >= now() - interval '7 days'),
    'deleted_accounts_total', (select count(*) from public.admin_audit_log where event_type = 'account_deleted'),
    'deleted_accounts_30d', (select count(*) from public.admin_audit_log where event_type = 'account_deleted' and created_at >= now() - interval '30 days'),
    'total_launches', (select coalesce(sum(launch_count), 0) from public.user_utility_usage),
    'theme_distribution', (
      select coalesce(jsonb_object_agg(k, c), '{}'::jsonb) from (
        select coalesce(default_theme, 'auto') as k, count(*) as c
        from public.user_settings group by 1
      ) t
    ),
    'language_distribution', (
      select coalesce(jsonb_object_agg(k, c), '{}'::jsonb) from (
        select coalesce(nullif(auto_translation_language, ''), 'en') as k, count(*) as c
        from public.user_settings group by 1
      ) t
    ),
    'display_mode_distribution', (
      select coalesce(jsonb_object_agg(k, c), '{}'::jsonb) from (
        select coalesce(utility_display_mode, 'compact') as k, count(*) as c
        from public.user_settings group by 1
      ) t
    )
  ) into v_result;

  return v_result;
end;
$$;

-- Generic admin-only audit writer, used by the admin UI for events that don't
-- have a dedicated function (e.g. logging a successful invite). The event_type
-- is validated against the table's check constraint on insert.
create or replace function public.log_admin_event(
  p_event_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_role text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select email, role into v_email, v_role
  from public.profiles where id = v_uid;

  insert into public.admin_audit_log (
    event_type, actor_id, actor_email, actor_role, metadata
  )
  values (
    p_event_type, v_uid, v_email, v_role, coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke execute on function public.get_admin_audit_log(integer, integer, text) from public, anon;
revoke execute on function public.get_admin_dashboard_stats() from public, anon;
revoke execute on function public.log_admin_event(text, jsonb) from public, anon;
grant execute on function public.get_admin_audit_log(integer, integer, text) to authenticated;
grant execute on function public.get_admin_dashboard_stats() to authenticated;
grant execute on function public.log_admin_event(text, jsonb) to authenticated;
