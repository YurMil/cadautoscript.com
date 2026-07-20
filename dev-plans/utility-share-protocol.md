# Utility Share-Link Protocol (issue #113)

The utility shell (`src/components/Utilities/UtilityShellPage.tsx`) supports
shareable calculation links: a utility's input state is serialized into the
page URL as `?calc=<base64url(JSON)>` and restored when the link is opened.
The shell side ships with the main site; each utility app opts in by speaking
the postMessage protocol below. Apps that do not opt in are unaffected — the
"Copy link" toolbar button only appears once support is announced.

## Envelope

The `?calc=` token is `base64url(JSON.stringify({v: 1, s: <state>}))`.

- `v` — schema version, currently `1`. Unknown versions are discarded by the
  shell (a stale link degrades to tool defaults, never an error).
- `s` — the tool-defined state object. Keep it to plain input values.
- Encoded length is capped at 2000 characters; oversized states are dropped.
- **Never put personal data in the state** — the URL is the transport and may
  end up in chat logs, bookmarks, and server logs.

## Messages

All messages are same-origin `window.postMessage` calls. The shell verifies
`event.origin === window.location.origin` and that the message came from the
utility iframe; apps should verify `event.origin` the same way.

### App → shell

| Message | When | Payload |
|---|---|---|
| `{type: 'cas:share-support'}` | Once, after the app is ready to accept a restore | — |
| `{type: 'cas:state-update', state}` | Whenever inputs change (debounce ~300 ms) | `state`: current input state |

### Shell → app

| Message | When | Payload |
|---|---|---|
| `{type: 'cas:restore-state', version, state}` | In response to `cas:share-support`, if the URL carries a valid `?calc=` token | `version`: schema version of the decoded envelope; `state`: the decoded state |

## App-side reference implementation

```ts
const ORIGIN = window.location.origin;

// 1. Listen for a restore BEFORE announcing support.
window.addEventListener('message', (event) => {
  if (event.origin !== ORIGIN) return;
  const data = event.data;
  if (data?.type === 'cas:restore-state' && data.version === 1) {
    applyInputs(migrate(data.state)); // validate every field; ignore junk
  }
});

// 2. Announce support once the app can apply a restore.
window.parent.postMessage({type: 'cas:share-support'}, ORIGIN);

// 3. Stream input changes (debounced).
const reportState = debounce(() => {
  window.parent.postMessage({type: 'cas:state-update', state: collectInputs()}, ORIGIN);
}, 300);
```

Rules for app authors:

1. **Validate every restored field** — the state arrives from a URL anyone can
   edit. Clamp numbers to valid ranges, whitelist enum values, ignore unknown
   keys. A malformed state must fall back to defaults, never crash (the shell's
   error boundary is the last resort, not the plan).
2. **Version your own state shape.** When an input is renamed or removed, keep
   accepting the old key for at least one release and migrate it.
3. **Only inputs, never results** — recompute outputs after restore so a link
   can never show numbers the current engine wouldn't produce.

## Wiring status

| App | Repo | Status |
|---|---|---|
| Blind Flange Calculator | YurMil/Blind-Flange-Calculator | PR #22 open |
| Dished End Calculator | YurMil/pressure-vessel-dished-end-calc | PR #7 open |
| Cylindrical Shell Rolling | YurMil/Shell-Rolling-Master | PR #3 open |

Update this table as apps adopt the protocol.
