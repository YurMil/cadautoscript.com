-- Close two holes in public.profiles.
--
-- 1. Self-promotion. update_profiles_combined lets a user update their own row,
--    and the API roles hold UPDATE on every column, including role. Any
--    signed-in user could therefore run
--      update profiles set role = 'admin' where id = auth.uid()
--    and pass is_admin() everywhere. The INSERT policy had the same gap for a
--    user whose profile row did not exist yet.
--    A BEFORE trigger now rejects any role other than the default unless the
--    caller is already an admin. Only the API roles are checked, so the
--    dashboard, service_role and security definer functions are unaffected.
--
-- 2. E-mail exposure. "Public profiles" is `using (true)` for every role, so
--    anon could list every user's e-mail address through PostgREST. SELECT is
--    now granted per column, without email. Admins read e-mail through
--    get_admin_users_list(), which is security definer. Client code must name
--    its columns: `select('*')` on profiles now fails.

create or replace function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role is distinct from 'user' and not public.is_admin() then
      raise exception 'Only admins can assign roles' using errcode = '42501';
    end if;
  elsif new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function public.guard_profile_role() from public, anon, authenticated;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
  before insert or update of role on public.profiles
  for each row
  execute function public.guard_profile_role();

revoke select on public.profiles from anon, authenticated;
grant select (id, username, avatar_url, bio, role, created_at, full_name, website, last_seen_at)
  on public.profiles to anon, authenticated;
