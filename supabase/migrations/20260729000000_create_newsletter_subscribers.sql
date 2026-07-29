-- Newsletter subscriptions with double opt-in (issue #119).
--
-- Email addresses are personal data, so this table is deliberately unreachable
-- from the browser: anon and authenticated hold NO table privileges at all.
-- Everything goes through the SECURITY DEFINER functions below, and the
-- subscribe path runs only in an Edge Function under the service role.
--
-- The reason subscribing is not an RPC: the confirmation token would have to be
-- returned to the caller, and anyone could then confirm an address they do not
-- own — which is exactly what double opt-in exists to prevent. The token is
-- created server-side and leaves only by email.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  -- Case-insensitive uniqueness is enforced by the index below on lower(email).
  email text not null check (
    char_length(email) <= 254
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'unsubscribed')),
  -- Serves as both the confirmation and the unsubscribe secret. Rotated on
  -- confirmation so a leaked signup link cannot later be used to unsubscribe.
  token uuid not null default gen_random_uuid(),
  locale text check (char_length(locale) <= 10),
  -- Set when a signed-in user subscribes, so account deletion takes the
  -- subscription with it. Null for anonymous visitors.
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  -- Bounds how often one address can trigger a confirmation email.
  last_email_sent_at timestamptz
);

create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));
create index if not exists newsletter_subscribers_token_idx
  on public.newsletter_subscribers (token);
create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status);

alter table public.newsletter_subscribers enable row level security;

-- Admins may read the list; nobody may write directly.
drop policy if exists "Admins can read subscribers" on public.newsletter_subscribers;
create policy "Admins can read subscribers"
  on public.newsletter_subscribers
  for select
  to authenticated
  using (public.is_admin());

revoke all on public.newsletter_subscribers from public, anon, authenticated;
grant select on public.newsletter_subscribers to authenticated;

-- ---------------------------------------------------------------------------
-- Confirmation. Anon-callable: possession of the token IS the authorisation,
-- and the token only ever reached the address that was signed up.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_newsletter_subscription(p_token uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_status text;
  v_id uuid;
begin
  if p_token is null then
    return 'invalid';
  end if;

  select id, status into v_id, v_status
  from public.newsletter_subscribers
  where token = p_token;

  if v_id is null then
    return 'invalid';
  end if;

  if v_status = 'confirmed' then
    return 'already-confirmed';
  end if;

  -- Rotate the token: the link that arrived by email is now spent, and the
  -- unsubscribe link issued from here is a different secret.
  update public.newsletter_subscribers
  set status = 'confirmed',
      confirmed_at = now(),
      unsubscribed_at = null,
      token = gen_random_uuid()
  where id = v_id;

  return 'confirmed';
end;
$$;

comment on function public.confirm_newsletter_subscription(uuid) is
  'Intentionally callable by anon: the unguessable token is the authorisation, and it only ever reached the subscribed address (issue #119).';

-- ---------------------------------------------------------------------------
-- Unsubscribe. Also anon-callable, for one-click unsubscribe from an email
-- client that will not carry a session.
-- ---------------------------------------------------------------------------
create or replace function public.unsubscribe_from_newsletter(p_token uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_id uuid;
  v_status text;
begin
  if p_token is null then
    return 'invalid';
  end if;

  select id, status into v_id, v_status
  from public.newsletter_subscribers
  where token = p_token;

  if v_id is null then
    return 'invalid';
  end if;

  if v_status = 'unsubscribed' then
    return 'already-unsubscribed';
  end if;

  update public.newsletter_subscribers
  set status = 'unsubscribed',
      unsubscribed_at = now()
  where id = v_id;

  return 'unsubscribed';
end;
$$;

comment on function public.unsubscribe_from_newsletter(uuid) is
  'Intentionally callable by anon: one-click unsubscribe must work from an email client with no session (issue #119).';

revoke execute on function public.confirm_newsletter_subscription(uuid) from public;
revoke execute on function public.unsubscribe_from_newsletter(uuid) from public;
grant execute on function public.confirm_newsletter_subscription(uuid) to anon, authenticated;
grant execute on function public.unsubscribe_from_newsletter(uuid) to anon, authenticated;
