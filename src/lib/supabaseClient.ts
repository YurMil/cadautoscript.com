import {logger} from './logger';
import type {
  SupabaseClient,
  AuthChangeEvent,
  Session,
  Subscription,
} from '@supabase/supabase-js';
import siteConfig from '@generated/docusaurus.config';

/**
 * Lazy Supabase client.
 *
 * `@supabase/supabase-js` (auth + postgrest + realtime + storage) is ~40KB gzip.
 * It used to be imported eagerly here, so it landed in the global `main.js`
 * bundle that loads on every page — including for anonymous visitors who never
 * sign in. To keep it out of the critical path we load the library with a
 * dynamic `import()` (a separate async chunk) the first time anything actually
 * touches the client, and expose a thin facade that preserves the exact
 * synchronous `supabase.auth.*` / `supabase.from(...)` / `rpc` / `functions`
 * call sites used across the app. Type-only imports above are erased at build
 * time and do NOT pull the runtime library in.
 *
 * The facade only implements the surface the app uses. If you reach for a new
 * method (storage, channels, etc.), add it here.
 */

const {SUPABASE_URL, SUPABASE_ANON_KEY} = siteConfig.customFields as {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
};

/**
 * Missing credentials must not throw at module scope: that turns a
 * configuration gap into a hard SSR build failure (it broke every Dependabot
 * PR, since those deliberately run without repository secrets) and, in the
 * browser, into a blank page instead of a site that simply has no auth.
 * Instead every client access rejects with a clear error, which the callers
 * already treat as "signed out / feature unavailable" (issue #102).
 */
const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isConfigured && typeof window !== 'undefined') {
  logger.error(
    '[Supabase] SUPABASE_URL / SUPABASE_ANON_KEY are not configured — ' +
      'authentication, comments, reactions and usage stats are disabled.',
  );
}

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * Loads (once) and returns the real Supabase client. Exposed for callers that
 * prefer to await the client explicitly; the `supabase` facade below covers the
 * existing synchronous usage.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (!isConfigured) {
    return Promise.reject(new Error('Supabase environment variables are not configured.'));
  }
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js')
      .then(({createClient}) =>
        createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string),
      )
      .catch((err) => {
        // Allow a later call to retry the dynamic import instead of being
        // permanently stuck on a rejected promise (e.g. transient CDN failure).
        clientPromise = null;
        throw err;
      });
  }
  return clientPromise;
}

/**
 * Records a method chain (`.select().eq().maybeSingle()`, `.update().eq()`, …)
 * and replays it against the real PostgrestBuilder once awaited. PostgrestBuilder
 * is itself thenable, so chains can terminate at any point with `await`.
 */
function lazyBuilder(getRoot: () => Promise<any>): any {
  const calls: Array<[string, unknown[]]> = [];
  const proxy: any = new Proxy(
    {},
    {
      get(_target, prop: string | symbol) {
        // Inspection/serialization (util.inspect & logger.log probe symbol
        // keys like Symbol.toStringTag/inspect; JSON.stringify probes toJSON).
        // Returning a chainable function for those would recurse infinitely, so
        // answer `undefined`. Neither is a PostgREST query method.
        if (typeof prop === 'symbol' || prop === 'toJSON') {
          return undefined;
        }
        if (prop === 'then') {
          return (onFulfilled?: any, onRejected?: any) =>
            getRoot()
              .then((root: any) => {
                let builder = root;
                for (const [method, args] of calls) {
                  builder = builder[method](...args);
                }
                return builder; // thenable — auto-awaited by the outer chain
              })
              .then(onFulfilled, onRejected);
        }
        if (prop === 'catch') {
          return (onRejected?: any) => proxy.then(undefined, onRejected);
        }
        if (prop === 'finally') {
          return (onFinally?: () => void) =>
            proxy.then(
              (value: any) => {
                onFinally?.();
                return value;
              },
              (err: any) => {
                onFinally?.();
                throw err;
              },
            );
        }
        // Any other property is a chainable query method: record and return self.
        return (...args: unknown[]) => {
          calls.push([prop as string, args]);
          return proxy;
        };
      },
    },
  );
  return proxy;
}

/**
 * Lazy RealtimeChannel: records `.on(...)` bindings synchronously, then on
 * `.subscribe()` loads the library, builds the real channel, replays the
 * bindings and subscribes. `removeChannel` (below) tears it down, honouring a
 * teardown that happens before the library finishes loading.
 */
function lazyChannel(name: string, opts?: unknown): any {
  const bindings: Array<[string, unknown[]]> = [];
  let realChannel: any = null;
  let cancelled = false;
  const channel: any = {
    on: (...args: unknown[]) => {
      bindings.push(['on', args]);
      return channel;
    },
    subscribe: (callback?: (status: string) => void) => {
      void getSupabase()
        .then((client) => {
          if (cancelled) {
            return;
          }
          let rc =
            opts !== undefined
              ? (client as any).channel(name, opts)
              : (client as any).channel(name);
          for (const [method, args] of bindings) {
            rc = rc[method](...args);
          }
          realChannel = rc;
          rc.subscribe(callback);
        })
        .catch((err) => {
          logger.error(
            '[Supabase Realtime] Failed to lazy-load Supabase for channel',
            err,
          );
        });
      return channel;
    },
    // Internal hooks used by removeChannel().
    __getRealChannel: () => realChannel,
    __cancel: () => {
      cancelled = true;
    },
  };
  return channel;
}

const facade = {
  auth: {
    getSession: (...args: unknown[]) =>
      getSupabase().then((c) => (c.auth.getSession as any)(...args)),
    getUser: (...args: unknown[]) =>
      getSupabase().then((c) => (c.auth.getUser as any)(...args)),
    signOut: (...args: unknown[]) =>
      getSupabase().then((c) => (c.auth.signOut as any)(...args)),
    signInWithOAuth: (...args: unknown[]) =>
      getSupabase().then((c) => (c.auth.signInWithOAuth as any)(...args)),
    setSession: (...args: unknown[]) =>
      getSupabase().then((c) => (c.auth.setSession as any)(...args)),
    exchangeCodeForSession: (...args: unknown[]) =>
      getSupabase().then((c) => (c.auth.exchangeCodeForSession as any)(...args)),
    /**
     * Mirrors the synchronous `{ data: { subscription } }` shape. The real
     * listener is attached once the library loads; unsubscribing before then is
     * honoured. The initial INITIAL_SESSION callback simply fires a tick later
     * than with the eager client — consumers also call getSession() for the
     * initial state, so this is transparent.
     */
    onAuthStateChange: (
      callback: (event: AuthChangeEvent, session: Session | null) => void,
    ): {data: {subscription: Subscription}} => {
      let realSubscription: Subscription | null = null;
      let cancelled = false;
      void getSupabase()
        .then((c) => {
          if (cancelled) {
            return;
          }
          realSubscription = c.auth.onAuthStateChange(callback).data.subscription;
        })
        .catch((err) => {
          logger.error(
            '[Supabase Auth] Failed to lazy-load Supabase for onAuthStateChange',
            err,
          );
        });
      const subscription = {
        id: 'lazy-supabase-subscription',
        callback,
        unsubscribe: () => {
          cancelled = true;
          realSubscription?.unsubscribe();
        },
      } as unknown as Subscription;
      return {data: {subscription}};
    },
  },
  from: (table: string) => lazyBuilder(() => getSupabase().then((c) => c.from(table))),
  rpc: (fn: string, args?: Record<string, unknown>) =>
    lazyBuilder(() => getSupabase().then((c) => (c.rpc as any)(fn, args))),
  functions: {
    invoke: (...args: unknown[]) =>
      getSupabase().then((c) => (c.functions.invoke as any)(...args)),
  },
  channel: (name: string, opts?: unknown) => lazyChannel(name, opts),
  removeChannel: (channel: any) => {
    channel?.__cancel?.();
    const realChannel = channel?.__getRealChannel?.();
    return getSupabase().then((c) =>
      realChannel ? (c as any).removeChannel(realChannel) : 'ok',
    );
  },
};

/**
 * Drop-in replacement for the previous eager client. Typed as SupabaseClient so
 * call sites keep full type-safety; only the implemented surface is backed at
 * runtime (see facade above).
 */
export const supabase = facade as unknown as SupabaseClient;
