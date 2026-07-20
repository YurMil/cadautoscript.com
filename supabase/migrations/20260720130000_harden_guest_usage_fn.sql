-- Harden increment_guest_utility_usage against table bloat (PR #123 review).
--
-- The function is intentionally callable by anon, so a malicious client could
-- previously insert unlimited distinct ids matching the format check. The
-- utility id list lives in the frontend (src/data/utilities.ts) and changes
-- with releases, so instead of duplicating it here we bound the damage: new
-- distinct ids are refused once the table holds MAX_TRACKED_UTILITIES rows.
-- Increments of existing rows are always allowed, so legitimate utilities
-- (currently ~30) are never starved; junk is capped at a few dozen rows an
-- admin can delete at any time.
create or replace function public.increment_guest_utility_usage(p_utility_id text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  max_tracked_utilities constant integer := 100;
begin
  if p_utility_id is null or p_utility_id !~ '^[a-z0-9][a-z0-9-]{0,99}$' then
    raise exception 'Invalid utility id';
  end if;

  if not exists (select 1 from public.guest_utility_usage where utility_id = p_utility_id)
     and (select count(*) from public.guest_utility_usage) >= max_tracked_utilities then
    -- Silently ignore new ids past the cap: real utilities are registered long
    -- before the cap is reached, so anything beyond it is noise.
    return;
  end if;

  insert into public.guest_utility_usage (utility_id, launch_count, last_opened_at)
  values (p_utility_id, 1, now())
  on conflict (utility_id) do update
    set launch_count = public.guest_utility_usage.launch_count + 1,
        last_opened_at = now();
end;
$$;
