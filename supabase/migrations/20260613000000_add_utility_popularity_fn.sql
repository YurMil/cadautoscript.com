-- Global utility popularity ranking, exposed to anonymous visitors.
-- Returns ONLY aggregate counts per utility (no user_id) so it leaks no
-- per-user data. SECURITY DEFINER lets it read past RLS to aggregate all rows.
create or replace function public.get_utility_popularity()
returns table (utility_id text, total_launches bigint)
language sql
stable
security definer
set search_path = public
as $$
  select utility_id, sum(launch_count)::bigint as total_launches
  from public.user_utility_usage
  group by utility_id
  order by total_launches desc, utility_id asc;
$$;

revoke all on function public.get_utility_popularity() from public;
grant execute on function public.get_utility_popularity() to anon, authenticated;
