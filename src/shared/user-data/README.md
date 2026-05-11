# `@site/src/shared/user-data`

Per-user JSONB storage for microapps on cadautoscript.com. Built on
the `user_app_documents` Supabase table with RLS and Realtime.

Spec: `Focus-Planner/docs/technical_spec_focus_planner_user_data_sync_en.md`
sections §FR-10, §10, §25.

## When to use it

Use this SDK when your microapp needs to save lightweight per-user state
(saved calculations, presets, recent inputs, UI prefs) and **does not**
need any of:

- Transactional invariants (e.g. "only one active timer per user").
- Offline-first writes with a local outbox.
- A dedicated schema with relations.
- Sub-second realtime conflict resolution.

For apps that need those, follow the Focus Planner pattern with dedicated
tables under `focus_*` and a sync engine.

## Quick start

```ts
import {createUserDataClient} from '@site/src/shared/user-data';

const userData = createUserDataClient({appSlug: 'blind-flange-calculator'});

// Save
await userData.saveDocument('saved-calcs', calc.id, {
  input,
  result,
  savedAt: new Date().toISOString(),
});

// Load all
const saved = await userData.listDocuments<{
  input: BlindFlangeInput;
  result: BlindFlangeResult;
}>('saved-calcs');

// Load one
const one = await userData.getDocument('saved-calcs', calc.id);

// Delete (soft)
await userData.deleteDocument('saved-calcs', calc.id);

// Cross-device updates
const unsub = userData.subscribe('saved-calcs', (change) => {
  if (change.kind === 'deleted') {
    removeFromUi(change.documentId);
  } else {
    upsertInUi(change.current!);
  }
});
// later
unsub();
```

## Auth

The SDK calls `supabase.auth.getUser()` for every operation. If the user
is not signed in, the SDK throws `Error('Not authenticated')`. Guard your
UI with the existing `useAuthStatus()` hook and only call SDK methods when
`isAuthenticated === true`.

## Keying

Documents are uniquely keyed by:

```
(user_id, app_slug, collection, document_id)
```

- `app_slug` is bound once at `createUserDataClient({appSlug})`.
- `collection` and `documentId` are caller-supplied strings — pick stable
  identifiers (UUIDs for documents are recommended).
- A soft-deleted document is "resurrected" if you `saveDocument` again
  with the same key.

## Isolation

RLS confines reads/writes to `user_id = auth.uid()`. The unique index on
`(user_id, app_slug, collection, document_id) WHERE deleted_at IS NULL`
guarantees no app can read another app's namespace, and no user can read
another user's data. Even if your code tried to query a different
`app_slug`, the table policy still blocks rows from other users.

## Realtime

Subscriptions are filtered server-side by `app_slug` and narrowed
client-side by `collection`. Echoes from the current device are dropped
using the `device_id` column so your local optimistic UI is not
re-rendered when your own write round-trips.

## What this SDK does NOT do

- **No local cache.** Each call hits Supabase. If you need an in-memory
  cache, layer it on top (TanStack Query / SWR work well).
- **No conflict resolution.** Last-write-wins via upsert.
- **No queue.** `syncNow()` is a no-op for API parity with future
  Focus-Planner-style clients.
- **No backups.** Use Supabase's PITR if you need that.
