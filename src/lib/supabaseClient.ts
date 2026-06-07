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

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not configured.');
}

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * Loads (once) and returns the real Supabase client. Exposed for callers that
 * prefer to await the client explicitly; the `supabase` facade below covers the
 * existing synchronous usage.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({createClient}) =>
      createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string),
    );
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
      void getSupabase().then((c) => {
        if (cancelled) {
          return;
        }
        realSubscription = c.auth.onAuthStateChange(callback).data.subscription;
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
};

/**
 * Drop-in replacement for the previous eager client. Typed as SupabaseClient so
 * call sites keep full type-safety; only the implemented surface is backed at
 * runtime (see facade above).
 */
export const supabase = facade as unknown as SupabaseClient;
