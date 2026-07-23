-- Saved calculation history for signed-in users (issue #115).
--
-- Each row is one snapshot of a utility's *input* state, stored in the same
-- versioned envelope the share links use (see dev-plans/utility-share-protocol.md),
-- so reopening an entry is exactly reopening a share link. Results are never
-- stored — they are recomputed by the tool, so history can never surface
-- numbers the current engine would not produce.
--
-- `on delete cascade` against auth.users means the account-deletion flow
-- (supabase/functions/account-self-delete) wipes history with no extra code.
create table if not exists public.user_calculation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  utility_id text not null check (utility_id ~ '^[a-z0-9][a-z0-9-]{0,99}$'),
  schema_version integer not null default 1 check (schema_version between 1 and 100),
  -- Bounded to keep a hand-crafted client from writing arbitrarily large rows.
  state jsonb not null check (char_length(state::text) <= 8000),
  label text check (char_length(label) <= 120),
  created_at timestamptz not null default now()
);

create index if not exists user_calculation_history_user_created_idx
  on public.user_calculation_history (user_id, created_at desc);

alter table public.user_calculation_history enable row level security;

drop policy if exists "Users can read their own calculation history"
  on public.user_calculation_history;
create policy "Users can read their own calculation history"
  on public.user_calculation_history
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can save their own calculations"
  on public.user_calculation_history;
create policy "Users can save their own calculations"
  on public.user_calculation_history
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own calculations"
  on public.user_calculation_history;
create policy "Users can delete their own calculations"
  on public.user_calculation_history
  for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.user_calculation_history from public, anon, authenticated;
-- No UPDATE grant: entries are immutable snapshots, replaced rather than edited.
grant select, delete on public.user_calculation_history to authenticated;
grant insert (user_id, utility_id, schema_version, state, label)
  on public.user_calculation_history to authenticated;

-- Cap the history per user, evicting oldest first, so the table cannot grow
-- without bound and a user's list stays meaningful.
create or replace function public.trim_calculation_history()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  max_entries constant integer := 50;
begin
  delete from public.user_calculation_history
  where user_id = new.user_id
    and id not in (
      select id
      from public.user_calculation_history
      where user_id = new.user_id
      order by created_at desc
      limit max_entries
    );
  return null;
end;
$$;

drop trigger if exists trim_calculation_history_trigger
  on public.user_calculation_history;
create trigger trim_calculation_history_trigger
  after insert on public.user_calculation_history
  for each row execute function public.trim_calculation_history();
