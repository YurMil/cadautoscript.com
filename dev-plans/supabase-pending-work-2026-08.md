# Supabase: work that must be finished from a machine with project access

Written 2026-08-16. Everything below needs the Supabase CLI logged in against the
production project; none of it can be done from CI or from a checkout alone.

Read task 1 first — it is the only item where production is currently in a
half-applied state, and it is losing data every hour it stays that way.

---

## Task 1 — finish landing the client_error_log hardening (PR #164, merged)

### What is already true

PR #164 is merged and Vercel has deployed `main`. The browser bundle in
production now calls `supabase.functions.invoke('report-client-error', …)`
instead of inserting into `client_error_log` directly.

That function does not exist yet, and the migration has not been applied.

### What that means right now

- **Client error reports are being dropped.** The invoke fails, the failure is
  caught in `src/lib/errorReporting.ts` and logged to the console, and nothing
  is stored. Nothing crashes — reporting is deliberately incapable of throwing —
  but production errors are invisible until the function is deployed.
- **The hole PR #164 exists to close is still open.** `anon` keeps its `INSERT`
  grant on `client_error_log` until `20260816000000` is applied, so the public
  anon key can still write unbounded rows straight to PostgREST.

Neither is an emergency, but the window should be short. Deploy the function
first (restores reporting), then apply the migration (closes the hole).

### 1a. Deploy the Edge Function

```bash
supabase functions deploy report-client-error --project-ref <production-ref>
```

The project ref is in the Supabase dashboard URL, or in `supabase projects list`.
Do not use a ref taken from a PR check link — those are ephemeral preview
branches and differ on every PR.

Verify it answers before moving on:

```bash
curl -s -X POST "https://<production-ref>.supabase.co/functions/v1/report-client-error" -H "Authorization: Bearer <anon-key>" -H "Content-Type: application/json" -d '{"message":"deploy smoke test","source":"/manual-check"}'
```

Expect `{"ok":true}`. The function answers `{"ok":true}` for every outcome by
design, including throttled and malformed input, so this proves it is reachable,
not that the row landed. Confirm the row separately:

```sql
select message, source, created_at from public.client_error_log order by created_at desc limit 5;
```

Delete the smoke-test row afterwards if you care about a clean table.

### 1b. Set the IP salt (optional)

```bash
supabase secrets set ERROR_LOG_IP_SALT="$(openssl rand -hex 32)" --project-ref <production-ref>
```

Skipping this is safe: the function falls back to the service role key as the
salt, which is unguessable and never leaves the server. Set it if you would
rather the rate-limit hashes not be derived from the service key. Changing it
later only resets the current hour's quota buckets.

### 1c. Apply the migration

```bash
supabase db push
```

This applies `20260816000000_harden_client_error_log.sql` and nothing else —
earlier versions are already recorded as applied and are not re-run, including
the historical files edited in PR #166.

Verify the outcome. All four should hold:

```sql
-- 1. anon has no table-level or column-level INSERT
select grantee, privilege_type from information_schema.role_table_grants
where table_name = 'client_error_log' and grantee in ('anon', 'authenticated');
select count(*) from information_schema.column_privileges
where table_name = 'client_error_log' and grantee in ('anon', 'authenticated')
  and privilege_type = 'INSERT';

-- 2. no INSERT policy remains
select * from pg_policies where tablename = 'client_error_log' and cmd = 'INSERT';

-- 3. the quota-checked path exists
select proname from pg_proc where proname = 'record_client_error';
select tablename from pg_tables where tablename = 'client_error_report_quota';

-- 4. reporting still works end to end — re-run the curl above, then:
select count(*) from public.client_error_log where created_at > now() - interval '5 minutes';
```

Expected: `authenticated: SELECT` only; `0` column grants; no INSERT policy;
both objects present; the count increases after the curl.

### 1d. Confirm the direct path is actually closed

The point of the change. This must now fail:

```bash
curl -s -X POST "https://<production-ref>.supabase.co/rest/v1/client_error_log" -H "apikey: <anon-key>" -H "Authorization: Bearer <anon-key>" -H "Content-Type: application/json" -d '{"message":"should be rejected","source":"/direct"}'
```

Expect a permission-denied error, not `201`. If it succeeds, the migration did
not apply — recheck 1c before assuming otherwise.

---

## Task 2 — close the `public.profiles` gap in the migration history

### Background

The `Supabase Preview` check builds a database from `supabase/migrations/`
alone. It has been failing since 2 July. PR #166 fixed the first cause
(`is_admin()` was defined by hand in production and never entered the migration
history); the check now gets three migrations further and fails on the next
instance of the same problem:

```
ERROR: relation "public.profiles" does not exist (SQLSTATE 42P01)
At statement: 2
drop trigger if exists trg_log_role_change on public.profiles
```

`public.profiles` is an application table created by hand in the dashboard. It
is referenced by five migrations and defined by none:

- `20260613000001_add_admin_utility_usage_fn.sql` — first mention (inside a
  function body, so it resolves lazily and does not fail at apply time)
- `20260702000000_create_admin_audit_log.sql`
- `20260702000001_account_self_service_fns.sql`
- `20260702000002_admin_analytics_fns.sql`
- `20260702000003_role_change_audit_trigger.sql` — first hard failure, because a
  trigger names its table at creation time

This is why the check fails on exactly the PRs that touch `supabase/` and is
skipped on all others: **no migration has been validated by CI since 2 July.**

### Why this needs the real database

The migrations only reveal the columns they happen to touch — `id`, `email`,
`full_name`, `username`, `role`. The real table certainly has more, and it
certainly has RLS policies and grants that the migrations never mention.

Writing `create table if not exists public.profiles (…)` from those five columns
would not affect production, where the table already exists — but every preview
branch and any future rebuild would get a truncated, probably unprotected
`profiles`, and the check would go green while describing a schema that does not
exist. A green check that lies is worse than the red one.

### Dump the real definition

```bash
supabase db dump --project-ref <production-ref> --schema public > /tmp/public-schema.sql
```

From that file, extract everything about `profiles`, not just the table:

- `CREATE TABLE public.profiles (…)` with all columns, defaults and constraints
- indexes
- `ALTER TABLE … ENABLE ROW LEVEL SECURITY`
- every `CREATE POLICY … ON public.profiles`
- `GRANT` / `REVOKE` statements naming `profiles`
- any trigger or function attached to it that is not already in
  `supabase/migrations/` (`handle_new_user` and similar are common)

Also dump `is_admin()` itself while you are there and compare it against the
deny-all stub PR #166 adds — the stub is only a fallback for fresh databases,
but knowing the real definition is worth having written down:

```bash
supabase db dump --project-ref <production-ref> --schema public | grep -A 20 "FUNCTION public.is_admin"
```

### Where to put it

Follow the pattern PR #166 established: bootstrap the object in the earliest
migration that references it, guarded so production is never touched.

That is `20260613000001_add_admin_utility_usage_fn.sql` — the same file, which
already carries the `is_admin()` guard and is the first to mention `profiles`.
Add a guarded `create table if not exists public.profiles (…)` plus its RLS,
policies and grants above the existing function definition.

Editing an applied migration is safe: Supabase records migrations by version and
will not re-run them, and `if not exists` means the block is inert against a
database that already has the table.

### Verify locally before pushing

No Supabase access needed for this part — it is the same harness used to verify
PR #166:

```bash
docker run -d --name mig-check -e POSTGRES_PASSWORD=test -p 55440:5432 postgres:17-alpine
```

Scaffold **only** what Supabase itself provides, so anything missing from the
migration history shows up as a failure rather than being papered over:

```sql
create role anon; create role authenticated; create role service_role;
create schema if not exists auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
```

Do **not** create `profiles` or `is_admin()` in the scaffold — those are the
things under test. Then apply every migration in filename order and confirm all
of them succeed. When that passes with nothing but the four lines above, the
preview check will pass too.

---

## Task 3 — make the check mean something

Once preview goes green, make it required on `main` in the branch protection
settings. It is the only thing that would have caught either of these gaps, and
while it fails for an unrelated reason it silently protects nothing.

---

## Status at the time of writing

| Item | State |
|---|---|
| PR #164 — client_error_log via Edge Function | merged; **function not deployed, migration not applied** |
| PR #165 — camera scoped to QR Master | open, CI green, needs a preview smoke test (see the PR body) |
| PR #166 — `is_admin()` bootstrap order | open, verified locally; preview still red on `profiles` |
| PR #163 — dompurify 3.4.12 → 3.4.13 | open, CI green, closes the last dependabot alert |
| dependabot `image-size` ×2 | dismissed as not-used (build-time only, no patch exists) |
