-- Append-only client-side error log (issue #98).
--
-- Anonymous visitors may report runtime errors, so INSERT is open to anon and
-- authenticated roles. Abuse is bounded by hard length checks here plus a
-- per-session cap and dedupe on the client. Deliberately stores NO user
-- identity — only the error itself and non-identifying context (route, tool,
-- user agent, locale). Only admins may read; nobody may update or delete.
-- public.is_admin() predates the migration history (defined directly in the
-- production database), so fresh preview branches don't have it and every
-- policy referencing it fails. Create a deny-all stub only when the function
-- is missing: production keeps its real definition, preview branches get a
-- safe default (nobody is admin).
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

create table if not exists public.client_error_log (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) <= 1000),
  stack text check (char_length(stack) <= 6000),
  source text not null check (char_length(source) <= 300),
  context text check (char_length(context) <= 200),
  user_agent text check (char_length(user_agent) <= 400),
  locale text check (char_length(locale) <= 10),
  created_at timestamptz not null default now()
);

create index if not exists client_error_log_created_at_idx
  on public.client_error_log (created_at desc);

alter table public.client_error_log enable row level security;

drop policy if exists "Anyone can report errors" on public.client_error_log;
create policy "Anyone can report errors"
  on public.client_error_log
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can read error log" on public.client_error_log;
create policy "Admins can read error log"
  on public.client_error_log
  for select
  to authenticated
  using (public.is_admin());

revoke all on public.client_error_log from public;
revoke all on public.client_error_log from anon;
revoke all on public.client_error_log from authenticated;
-- Column-level INSERT grant: clients cannot supply id/created_at, so those
-- always come from the column defaults and cannot be spoofed.
grant insert (message, stack, source, context, user_agent, locale)
  on public.client_error_log to anon, authenticated;
grant select on public.client_error_log to authenticated;
