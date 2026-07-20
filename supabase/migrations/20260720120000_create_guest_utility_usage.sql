-- Aggregate launch counters for anonymous visitors (issue #112).
--
-- Guests can now run every utility, so their launches must be measurable
-- separately from signed-in usage (`user_utility_usage`). Deliberately stores
-- NO identity — no user ids, sessions, or IPs — only a per-utility counter.
-- All access goes through the SECURITY DEFINER function below; the table has
-- RLS enabled with an admin-only read policy and no direct write path.
create table if not exists public.guest_utility_usage (
  utility_id text primary key check (utility_id ~ '^[a-z0-9][a-z0-9-]{0,99}$'),
  launch_count bigint not null default 0,
  last_opened_at timestamptz not null default now()
);

alter table public.guest_utility_usage enable row level security;

drop policy if exists "Admins can read guest usage" on public.guest_utility_usage;
create policy "Admins can read guest usage"
  on public.guest_utility_usage
  for select
  to authenticated
  using (public.is_admin());

revoke all on public.guest_utility_usage from public;
revoke all on public.guest_utility_usage from anon;
revoke all on public.guest_utility_usage from authenticated;
grant select on public.guest_utility_usage to authenticated;

create or replace function public.increment_guest_utility_usage(p_utility_id text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_utility_id is null or p_utility_id !~ '^[a-z0-9][a-z0-9-]{0,99}$' then
    raise exception 'Invalid utility id';
  end if;

  insert into public.guest_utility_usage (utility_id, launch_count, last_opened_at)
  values (p_utility_id, 1, now())
  on conflict (utility_id) do update
    set launch_count = public.guest_utility_usage.launch_count + 1,
        last_opened_at = now();
end;
$$;

comment on function public.increment_guest_utility_usage(text) is
  'Intentionally callable by anon: increments an aggregate per-utility launch counter; stores no user identity (issue #112).';

revoke execute on function public.increment_guest_utility_usage(text) from public;
grant execute on function public.increment_guest_utility_usage(text) to anon, authenticated;
