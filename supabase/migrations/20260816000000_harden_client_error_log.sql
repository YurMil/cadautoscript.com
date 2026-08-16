-- Close the anonymous write path into client_error_log (follow-up to issue #98).
--
-- The table accepted INSERTs from anon so the browser could post its own
-- crashes. What made that look bounded -- a per-page-load cap and dedupe by
-- message -- lives in src/lib/errorReporting.ts, i.e. entirely on the reporting
-- side. The anon key ships inside the JS bundle, so anything could POST
-- straight to PostgREST and write unbounded rows of nearly 8 KB each, and the
-- client-side caps would never see the traffic.
--
-- Reports now arrive through the report-client-error Edge Function, which runs
-- under the service role and calls record_client_error() below. The quota lives
-- in the database rather than the function so that concurrent reports cannot
-- race past it, and so it survives the function being redeployed.

-- ---------------------------------------------------------------------------
-- 1. Remove the direct write path.
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can report errors" on public.client_error_log;

-- The original grant was column-level; revoke it in both forms so the outcome
-- does not depend on how the server folds column privileges into table ones.
revoke insert (message, stack, source, context, user_agent, locale)
  on public.client_error_log from anon, authenticated;
revoke insert on public.client_error_log from anon, authenticated;

-- Admin read access (the "Admins can read error log" policy) is unchanged.

-- ---------------------------------------------------------------------------
-- 2. Rate-limit bookkeeping.
-- ---------------------------------------------------------------------------
-- Deliberately a separate table from the error log: client_error_log stores no
-- identity at all, and that stays true. Nothing here is joinable back to a
-- report -- there is no shared key and no timestamp precise enough to correlate
-- one, and rows are pruned once their window is spent.
create table if not exists public.client_error_report_quota (
  -- SHA-256 of (secret salt || client address). Never the address itself: this
  -- exists to bound abuse, not to recognise anyone, so a one-way digest is all
  -- the function needs to count against.
  ip_hash text primary key check (ip_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  report_count integer not null default 0
);

alter table public.client_error_report_quota enable row level security;

-- No policies and no grants: only the service role reaches this table, and it
-- bypasses RLS. Enabling RLS anyway means a future accidental grant still
-- denies by default.
revoke all on public.client_error_report_quota from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Quota-checked insert.
-- ---------------------------------------------------------------------------
create or replace function public.record_client_error(
  p_ip_hash text,
  p_message text,
  p_stack text,
  p_source text,
  p_context text,
  p_user_agent text,
  p_locale text
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  window_length constant interval := interval '1 hour';
  -- One address may report this many times per window. A browser that is
  -- genuinely broken sends at most MAX_REPORTS (10) per page load, so this
  -- leaves room for a few reloads before anything is dropped.
  max_per_ip constant integer := 30;
  -- ...and this is the ceiling for the whole table per window, so a flood
  -- spread over many addresses -- or one that forges its address header -- is
  -- bounded regardless of how well the per-address count holds up.
  max_per_window constant integer := 2000;
  v_count integer;
  v_window_total integer;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  if p_message is null or char_length(btrim(p_message)) = 0 then
    return false;
  end if;

  -- Claim a slot. An expired window is reset in place rather than deleted, so
  -- this stays one statement and two simultaneous reports cannot both read a
  -- stale count before either writes.
  insert into public.client_error_report_quota (ip_hash, window_started_at, report_count)
  values (p_ip_hash, now(), 1)
  on conflict (ip_hash) do update
    set report_count = case
          when public.client_error_report_quota.window_started_at < now() - window_length then 1
          else public.client_error_report_quota.report_count + 1
        end,
        window_started_at = case
          when public.client_error_report_quota.window_started_at < now() - window_length then now()
          else public.client_error_report_quota.window_started_at
        end
  returning report_count into v_count;

  if v_count > max_per_ip then
    return false;
  end if;

  select count(*) into v_window_total
  from public.client_error_log
  where created_at > now() - window_length;

  if v_window_total >= max_per_window then
    return false;
  end if;

  -- Truncate rather than reject: a report that is 20 bytes over the column
  -- limit is still worth having, and the caller cannot fix it. Empty strings
  -- become NULL so "no stack" reads the same however the caller spelled it.
  insert into public.client_error_log (message, stack, source, context, user_agent, locale)
  values (
    left(p_message, 1000),
    nullif(left(p_stack, 6000), ''),
    coalesce(nullif(left(p_source, 300), ''), '/'),
    nullif(left(p_context, 200), ''),
    nullif(left(p_user_agent, 400), ''),
    nullif(left(p_locale, 10), '')
  );

  -- Opportunistic prune, so the quota table does not accumulate one row per
  -- address seen forever. Two windows of slack keeps it clear of the reset
  -- logic above.
  if random() < 0.02 then
    delete from public.client_error_report_quota
    where window_started_at < now() - (window_length * 2);
  end if;

  return true;
end;
$$;

comment on function public.record_client_error(text, text, text, text, text, text, text) is
  'Quota-checked insert into client_error_log. Called only by the report-client-error Edge Function under the service role; anon lost its direct INSERT in this migration (issue #98 follow-up).';

revoke execute on function public.record_client_error(text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_client_error(text, text, text, text, text, text, text)
  to service_role;
