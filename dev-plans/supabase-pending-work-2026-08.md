# Supabase: production state and remaining work

First written 2026-08-16. Rewritten 2026-09-16, once the tasks it originally
tracked were done. Production project: `bkcimygtsnckzexbfqxh`.

The underlying theme still holds: **`supabase/migrations/` and the production
migration history do not line up.** The schema itself now matches the
repository. What is left is bookkeeping (task A), and until it is done nothing
reaches production automatically.

---

## Current state (2026-09-16)

| Item | State |
|---|---|
| Schema | Every file in `supabase/migrations/` is applied to production. |
| `public.profiles` / `is_admin()` | Bootstrapped, guarded, in `20260613000001`. A database built from the repo alone now applies every migration. |
| `20260816000000_harden_client_error_log` | **Applied.** anon/authenticated have no INSERT on `client_error_log`; `record_client_error()` and `client_error_report_quota` exist. |
| Edge Function `report-client-error` | **Deployed** (`verify_jwt` on). Checked end to end: a report through the function is stored, and a direct PostgREST insert returns 401. `ERROR_LOG_IP_SALT` is not set; the function falls back to the service role key. |
| `20260915000000_create_workspaces` (PR #175) | **Applied.** |
| `20260916000000_harden_profiles` (PR #177) | **Applied.** Users can no longer set their own `role`; `profiles.email` is no longer readable by anon/authenticated. |
| Edge Function `newsletter-subscribe` | **Not deployed** — see task B. |
| `Supabase Preview` on PRs | Green (first time since July). |
| `Supabase Preview` on `main` | Still red, with `Remote migration versions not found in local migrations directory` — see task A. |

## How production changes are applied until task A is done

The GitHub integration does not sync, so migrations were applied by hand
through the Supabase connector (`execute_sql`). Each one went through the same
steps:

1. **Check for collisions.** Look for existing objects with the same names —
   `create table if not exists` silently keeps a different table, and
   `create or replace` silently overwrites a function.
2. **Dry run.** Inside one transaction:
   - apply the migration;
   - exercise the real call paths as `anon`, `authenticated` and
     `service_role`. Set `set local role …` and
     `request.jwt.claims` to impersonate real users;
   - end with a `raise exception` that carries the results, so everything
     rolls back;
   - confirm afterwards that nothing was left behind.
3. **Apply.** Apply the file verbatim in one transaction, and insert the
   **repo's** version into `supabase_migrations.schema_migrations` in the same
   transaction:

   ```sql
   insert into supabase_migrations.schema_migrations (version, name, statements)
   values ('<version from the file name>', '<name>', array['-- applied from supabase/migrations/<file>']);
   ```

   Do not use the connector's `apply_migration` for repo files. It records a
   fresh timestamp as the version, which is exactly how the drift in task A
   came about.
4. **Verify.**
   - Check catalog state: grants, policies, functions.
   - Make real REST/function calls with the anon key.
   - Run the security advisor.

Edge Functions deploy fine through the connector (`deploy_edge_function`).
Pass the file from `supabase/functions/<name>/` verbatim, then read it back
with `get_edge_function`.

---

## Task A — reconcile the migration history

Production records most migrations under the timestamps the connector
assigned when they were applied. The repository uses rounded versions. The
schema is the same; only the version keys differ. The CLI compares keys, so
`db push` and the `main` preview check both refuse.

| Repo file | Production version | Notes |
|---|---|---|
| `20260512000000_create_user_utility_usage` | — | no matching record; the table exists in production |
| `20260514000000_create_user_settings` | `20260514161254` | |
| `20260613000000_add_utility_popularity_fn` | `20260613085540` | recorded as `add_global_utility_popularity_fn` |
| `20260613000001_add_admin_utility_usage_fn` | `20260613193429` | |
| `20260702000000` … `20260702000003` | `20260702161444` … `20260702161538` | same order |
| — | `20260702161609 lock_down_role_change_trigger_fn` | the repo does this inside `20260702000003` |
| `20260720000000_create_client_error_log` | `20260720073213` | |
| `20260720100000_security_advisor_cleanup` | `20260720091511` | |
| `20260720120000_create_guest_utility_usage` | `20260720100542` | |
| `20260720130000_harden_guest_usage_fn` | `20260720103715` | |
| `20260723000000_create_user_calculation_history` | `20260723205925` | |
| `20260729000000_create_newsletter_subscribers` | `20260729105337` | |
| `20260816000000`, `20260915000000`, `20260916000000` | same | already aligned |

Remote-only records with no repo file:

- `20260511190354` … `20260511194904` — seven migrations named `focus_*` and
  `user_app_documents*`;
- `20260512080754 lockdown_admin_definer_functions`.

They fall into two groups:

- **`user_app_documents` and `user_app_documents_realtime`.** This repository
  uses this table: `src/shared/user-data/` reads and writes it. The table
  therefore belongs in `supabase/migrations/`.
- **`focus_*`.** These create the Focus-Planner sync tables (`focus_tasks`,
  `focus_timer_sessions`, …). The spec lives in the Focus-Planner repository
  (see `src/shared/user-data/README.md`). No code here uses them.
- **`lockdown_admin_definer_functions`.** Not yet checked. Read its
  `statements` in `supabase_migrations.schema_migrations` before deciding.

### Steps

1. **Deal with the remote-only records.**
   - **Capture what this repository owns.** At least `user_app_documents`,
     plus whatever `lockdown_admin_definer_functions` turns out to be. The
     original SQL is stored in the `statements` column of
     `supabase_migrations.schema_migrations`. Commit each file under its
     **existing** remote version, so no repair is needed for it.
   - **Move the rest.** The `focus_*` migrations belong in the Focus-Planner
     repository. Once they live there, mark them `reverted` here, or keep
     copies in this repository if both apps are meant to share one migration
     history.

   **Confirm before repairing.** `migration repair` only changes bookkeeping;
   it never undoes schema.
2. **Re-key the renamed migrations to the repo versions.** This is
   bookkeeping only:

   ```bash
   supabase link --project-ref bkcimygtsnckzexbfqxh
   supabase migration repair --linked --status reverted 20260514161254 20260613085540 20260613193429 20260702161444 20260702161503 20260702161526 20260702161538 20260720073213 20260720091511 20260720100542 20260720103715 20260723205925 20260729105337
   supabase migration repair --linked --status applied 20260512000000 20260514000000 20260613000000 20260613000001 20260702000000 20260702000001 20260702000002 20260702000003 20260720000000 20260720100000 20260720120000 20260720130000 20260723000000 20260729000000
   ```

   `20260512000000` is marked applied because its table already exists in
   production. Diff the definition before relying on that.
3. **Check the result.** `supabase migration list --linked` should show every
   version on both sides. After that, `supabase db push --linked --dry-run`
   should report nothing to apply.

When the next push to `main` turns `Supabase Preview` green, migrations sync
automatically again. Then the manual procedure above is no longer needed.

## Task B — deploy `newsletter-subscribe`

The site calls `supabase.functions.invoke('newsletter-subscribe')` from
`src/shared/newsletter/`, but the function is not deployed. The subscription
form therefore cannot work in production. The table and its RPCs
(`20260729000000`) are in place.

The function reads these environment variables:

| Variable | Required | Default |
|---|---|---|
| `RESEND_API_KEY` | yes | — |
| `SITE_URL` | no | `https://cadautoscript.com` |
| `NEWSLETTER_FROM` | no | `CAD AutoScript <noreply@cadautoscript.com>` |

Set the secret first, then deploy:

```bash
supabase secrets set RESEND_API_KEY=<key> --project-ref bkcimygtsnckzexbfqxh
supabase functions deploy newsletter-subscribe --project-ref bkcimygtsnckzexbfqxh
```

Check that the sending domain is verified in Resend before announcing the
form.

## Task C — make the preview check required

Once task A turns `Supabase Preview` green on `main`, make it a required check
in the branch protection for `main`. It is the only check that catches
migrations missing from the repository.

The check reports two different failures depending on where it runs:

- **on a pull request**, it builds a fresh database from
  `supabase/migrations/`. This is now green.
- **on `main`**, it syncs to production. This fails until task A is done.

**Stale preview branches.** A PR's preview branch keeps its migration history
between pushes. If a migration file that the branch has already recorded is
edited, the edit is never re-run there, and the check keeps failing on old
content. Reset or delete that preview branch in the dashboard (Branches). A
branch created afterwards starts clean.

## Smaller follow-ups (from the security advisor)

- **`trim_calculation_history()` is a trigger function.** It is still
  executable by anon and authenticated. Calling it over RPC only errors, but
  revoking `execute` from `public, anon, authenticated` would clear the
  warning, as the workspace migration does for its triggers.
- **Leaked password protection is disabled.** Supabase offers it on paid plans
  only, so it is deferred while the project runs on the free tier.
- **"RLS enabled, no policy"** on `workspace_invites` and
  `client_error_report_quota` is intentional. Both are reachable only through
  security definer functions or the service role.
