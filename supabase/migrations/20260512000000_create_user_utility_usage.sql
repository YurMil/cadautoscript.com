create table if not exists public.user_utility_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  utility_id text not null,
  launch_count integer not null default 0 check (launch_count >= 0),
  first_opened_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  primary key (user_id, utility_id)
);

alter table public.user_utility_usage enable row level security;

create policy "Users can read their own utility usage"
on public.user_utility_usage
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own utility usage"
on public.user_utility_usage
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own utility usage"
on public.user_utility_usage
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.increment_utility_usage(p_utility_id text)
returns public.user_utility_usage
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.user_utility_usage;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_utility_id is null or btrim(p_utility_id) = '' then
    raise exception 'utility_id is required';
  end if;

  insert into public.user_utility_usage (
    user_id,
    utility_id,
    launch_count,
    first_opened_at,
    last_opened_at
  )
  values (
    v_user_id,
    p_utility_id,
    1,
    now(),
    now()
  )
  on conflict (user_id, utility_id)
  do update set
    launch_count = public.user_utility_usage.launch_count + 1,
    last_opened_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on public.user_utility_usage from public;
revoke all on public.user_utility_usage from anon;
grant select, insert, update on public.user_utility_usage to authenticated;

revoke execute on function public.increment_utility_usage(text) from public;
revoke execute on function public.increment_utility_usage(text) from anon;
grant execute on function public.increment_utility_usage(text) to authenticated;
