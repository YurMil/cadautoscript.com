-- public.is_admin() predates this migration history — it was defined straight
-- in the production database — so a database built from these files alone does
-- not have it. This is the first migration that mentions it, and the guard sits
-- here rather than at the first migration that *breaks* because the two are not
-- the same place: a reference inside a function body resolves when the function
-- runs, while a policy's USING expression resolves as the policy is created. So
-- this file applied cleanly on a fresh database and 20260702000000 was the one
-- that failed, which is why preview branches have been erroring on
-- "function public.is_admin() does not exist" since July.
--
-- Create a deny-all stub only when the function is missing: production keeps
-- its real definition, anything built from scratch gets a safe default where
-- nobody is an admin.
do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) then
    create function public.is_admin()
      returns boolean
      language sql
      stable
      as 'select false';
  end if;
end $$;

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
