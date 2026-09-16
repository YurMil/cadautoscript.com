-- Shared workspaces for small teams (issue #122).
--
-- A signed-in user creates a workspace and invites colleagues with a link.
-- Members share a calculation history and the report metadata defaults
-- (company name for title blocks, preferred standards).
--
-- Design notes:
-- * Membership is the only access path. Every policy goes through
--   is_workspace_member()/is_workspace_owner(), which are security definer so
--   the membership lookup does not recurse into workspace_members' own RLS.
-- * Structural changes (create, invite, join, leave, remove, delete) happen
--   only through the security definer RPCs below. The caller's identity always
--   comes from auth.uid(), never from a parameter.
-- * Invites are links, not emails: no mail provider, nothing to send. The
--   code is 244 random bits, returned once to the owner. Only its SHA-256 is
--   stored, so a database read does not reveal a usable invite.
-- * Shared entries are immutable snapshots, like personal history
--   (20260723000000). created_by plus a display-name snapshot keep entries
--   attributable after a member leaves or deletes their account.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  company_name text check (char_length(company_name) <= 120),
  preferred_standards text check (char_length(preferred_standards) <= 200),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text not null check (char_length(display_name) between 1 and 120),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx
  on public.workspace_members (user_id);

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  code_hash text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists workspace_invites_workspace_idx
  on public.workspace_invites (workspace_id);

create table if not exists public.workspace_calculations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  -- Filled by trigger from the member row; clients cannot set it.
  created_by_name text not null default '' check (char_length(created_by_name) <= 120),
  utility_id text not null check (utility_id ~ '^[a-z0-9][a-z0-9-]{0,99}$'),
  schema_version integer not null default 1 check (schema_version between 1 and 100),
  state jsonb not null check (char_length(state::text) <= 8000),
  label text check (char_length(label) <= 120),
  created_at timestamptz not null default now()
);

create index if not exists workspace_calculations_workspace_created_idx
  on public.workspace_calculations (workspace_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Membership helpers (used by policies and RPCs)
-- ---------------------------------------------------------------------------

create or replace function public.is_workspace_member(p_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner(p_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace and user_id = auth.uid() and role = 'owner'
  );
$$;

revoke execute on function public.is_workspace_member(uuid) from public, anon;
revoke execute on function public.is_workspace_owner(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

-- Name shown to other members: the profile's full name if the auth metadata
-- carries one, otherwise the local part of the e-mail. Internal only.
create or replace function public.workspace_display_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select left(coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(u.email, '@', 1), ''),
    'Member'
  ), 120)
  from auth.users u
  where u.id = p_user;
$$;

revoke execute on function public.workspace_display_name(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;
alter table public.workspace_calculations enable row level security;

drop policy if exists "Members can read their workspaces" on public.workspaces;
create policy "Members can read their workspaces"
  on public.workspaces
  for select
  to authenticated
  using (public.is_workspace_member(id));

drop policy if exists "Owners can update their workspaces" on public.workspaces;
create policy "Owners can update their workspaces"
  on public.workspaces
  for update
  to authenticated
  using (public.is_workspace_owner(id))
  with check (public.is_workspace_owner(id));

drop policy if exists "Members can read fellow members" on public.workspace_members;
create policy "Members can read fellow members"
  on public.workspace_members
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

-- workspace_invites: no policies. Invites are created, accepted and revoked
-- only through the RPCs below.

drop policy if exists "Members can read shared calculations" on public.workspace_calculations;
create policy "Members can read shared calculations"
  on public.workspace_calculations
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can share calculations" on public.workspace_calculations;
create policy "Members can share calculations"
  on public.workspace_calculations
  for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "Authors and owners can delete shared calculations" on public.workspace_calculations;
create policy "Authors and owners can delete shared calculations"
  on public.workspace_calculations
  for delete
  to authenticated
  using (created_by = auth.uid() or public.is_workspace_owner(workspace_id));

revoke all on public.workspaces from public, anon, authenticated;
revoke all on public.workspace_members from public, anon, authenticated;
revoke all on public.workspace_invites from public, anon, authenticated;
revoke all on public.workspace_calculations from public, anon, authenticated;

grant select on public.workspaces to authenticated;
grant update (name, company_name, preferred_standards) on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
-- No UPDATE grant: shared entries are immutable snapshots.
grant select, delete on public.workspace_calculations to authenticated;
grant insert (workspace_id, created_by, utility_id, schema_version, state, label)
  on public.workspace_calculations to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.touch_workspace_updated_at()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_workspace_updated_at_trigger on public.workspaces;
create trigger touch_workspace_updated_at_trigger
  before update on public.workspaces
  for each row execute function public.touch_workspace_updated_at();

-- Attribute a shared entry to the member who saved it, from the server side.
create or replace function public.stamp_workspace_calculation_author()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  select m.display_name into new.created_by_name
  from public.workspace_members m
  where m.workspace_id = new.workspace_id and m.user_id = new.created_by;

  new.created_by_name := coalesce(new.created_by_name, 'Member');
  return new;
end;
$$;

drop trigger if exists stamp_workspace_calculation_author_trigger on public.workspace_calculations;
create trigger stamp_workspace_calculation_author_trigger
  before insert on public.workspace_calculations
  for each row execute function public.stamp_workspace_calculation_author();

-- Cap shared history per workspace, evicting oldest first.
create or replace function public.trim_workspace_calculations()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  max_entries constant integer := 200;
begin
  delete from public.workspace_calculations
  where workspace_id = new.workspace_id
    and id not in (
      select id
      from public.workspace_calculations
      where workspace_id = new.workspace_id
      order by created_at desc
      limit max_entries
    );
  return null;
end;
$$;

drop trigger if exists trim_workspace_calculations_trigger on public.workspace_calculations;
create trigger trim_workspace_calculations_trigger
  after insert on public.workspace_calculations
  for each row execute function public.trim_workspace_calculations();

-- A workspace always has an owner while it has members: when the last owner
-- goes (leaves, is removed, or deletes their account), the longest-standing
-- member is promoted; when the last member goes, the workspace is deleted.
create or replace function public.reconcile_workspace_ownership()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_successor uuid;
begin
  -- The workspace itself is being deleted (cascade): nothing to reconcile.
  if not exists (select 1 from public.workspaces where id = old.workspace_id) then
    return null;
  end if;

  if exists (
    select 1 from public.workspace_members
    where workspace_id = old.workspace_id and role = 'owner'
  ) then
    return null;
  end if;

  select user_id into v_successor
  from public.workspace_members
  where workspace_id = old.workspace_id
  order by joined_at, user_id
  limit 1;

  if v_successor is null then
    delete from public.workspaces where id = old.workspace_id;
  else
    update public.workspace_members
    set role = 'owner'
    where workspace_id = old.workspace_id and user_id = v_successor;
  end if;

  return null;
end;
$$;

drop trigger if exists reconcile_workspace_ownership_trigger on public.workspace_members;
create trigger reconcile_workspace_ownership_trigger
  after delete on public.workspace_members
  for each row execute function public.reconcile_workspace_ownership();

revoke execute on function public.touch_workspace_updated_at() from public, anon, authenticated;
revoke execute on function public.stamp_workspace_calculation_author() from public, anon, authenticated;
revoke execute on function public.trim_workspace_calculations() from public, anon, authenticated;
revoke execute on function public.reconcile_workspace_ownership() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.create_workspace(p_name text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_workspace uuid;
  max_owned constant integer := 10;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if (select count(*) from public.workspace_members where user_id = v_uid and role = 'owner') >= max_owned then
    raise exception 'Workspace limit reached';
  end if;

  insert into public.workspaces (name, created_by)
  values (btrim(p_name), v_uid)
  returning id into v_workspace;

  insert into public.workspace_members (workspace_id, user_id, role, display_name)
  values (v_workspace, v_uid, 'owner', coalesce(public.workspace_display_name(v_uid), 'Member'));

  return v_workspace;
end;
$$;

create or replace function public.create_workspace_invite(p_workspace uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  max_active constant integer := 20;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_workspace_owner(p_workspace) then
    raise exception 'Not authorized';
  end if;

  delete from public.workspace_invites
  where workspace_id = p_workspace and (expires_at < now() or revoked_at is not null);

  if (select count(*) from public.workspace_invites where workspace_id = p_workspace) >= max_active then
    raise exception 'Too many active invites';
  end if;

  -- Two v4 UUIDs: 244 random bits, hex-encoded, URL-safe.
  v_code := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  insert into public.workspace_invites (workspace_id, code_hash, created_by, expires_at)
  values (
    p_workspace,
    encode(sha256(convert_to(v_code, 'UTF8')), 'hex'),
    v_uid,
    now() + interval '7 days'
  );

  return v_code;
end;
$$;

create or replace function public.accept_workspace_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_workspace uuid;
  max_members constant integer := 25;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select i.workspace_id into v_workspace
  from public.workspace_invites i
  where i.code_hash = encode(sha256(convert_to(coalesce(p_code, ''), 'UTF8')), 'hex')
    and i.revoked_at is null
    and i.expires_at > now();

  if v_workspace is null then
    raise exception 'Invite is invalid or has expired';
  end if;

  if exists (
    select 1 from public.workspace_members
    where workspace_id = v_workspace and user_id = v_uid
  ) then
    return v_workspace;
  end if;

  if (select count(*) from public.workspace_members where workspace_id = v_workspace) >= max_members then
    raise exception 'Workspace is full';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role, display_name)
  values (v_workspace, v_uid, 'member', coalesce(public.workspace_display_name(v_uid), 'Member'));

  return v_workspace;
end;
$$;

create or replace function public.revoke_workspace_invites(p_workspace uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_workspace_owner(p_workspace) then
    raise exception 'Not authorized';
  end if;

  update public.workspace_invites
  set revoked_at = now()
  where workspace_id = p_workspace and revoked_at is null;
end;
$$;

create or replace function public.leave_workspace(p_workspace uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.workspace_members
  where workspace_id = p_workspace and user_id = auth.uid();
end;
$$;

create or replace function public.remove_workspace_member(p_workspace uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_workspace_owner(p_workspace) then
    raise exception 'Not authorized';
  end if;
  if p_user = auth.uid() then
    raise exception 'Use leave_workspace to leave';
  end if;

  delete from public.workspace_members
  where workspace_id = p_workspace and user_id = p_user;
end;
$$;

create or replace function public.delete_workspace(p_workspace uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_workspace_owner(p_workspace) then
    raise exception 'Not authorized';
  end if;

  delete from public.workspaces where id = p_workspace;
end;
$$;

revoke execute on function public.create_workspace(text) from public, anon;
revoke execute on function public.create_workspace_invite(uuid) from public, anon;
revoke execute on function public.accept_workspace_invite(text) from public, anon;
revoke execute on function public.revoke_workspace_invites(uuid) from public, anon;
revoke execute on function public.leave_workspace(uuid) from public, anon;
revoke execute on function public.remove_workspace_member(uuid, uuid) from public, anon;
revoke execute on function public.delete_workspace(uuid) from public, anon;

grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.create_workspace_invite(uuid) to authenticated;
grant execute on function public.accept_workspace_invite(text) to authenticated;
grant execute on function public.revoke_workspace_invites(uuid) to authenticated;
grant execute on function public.leave_workspace(uuid) to authenticated;
grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;
grant execute on function public.delete_workspace(uuid) to authenticated;
