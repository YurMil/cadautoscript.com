-- Admin-only per-user utility usage breakdown. Joins usage rows with profile
-- identity so an admin can see who launched what. Guarded by is_admin();
-- SECURITY DEFINER is required to read across all users past RLS.
create or replace function public.get_admin_utility_usage()
returns table (
  user_id uuid,
  full_name text,
  username text,
  email text,
  utility_id text,
  launch_count integer,
  last_opened_at timestamptz
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
      u.user_id,
      p.full_name,
      p.username,
      p.email,
      u.utility_id,
      u.launch_count,
      u.last_opened_at
    from public.user_utility_usage u
    left join public.profiles p on p.id = u.user_id
    order by u.launch_count desc, u.last_opened_at desc;
end;
$$;

revoke all on function public.get_admin_utility_usage() from public, anon;
grant execute on function public.get_admin_utility_usage() to authenticated;
