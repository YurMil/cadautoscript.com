import type {RealtimeChannel} from '@supabase/supabase-js';
import {createSupabaseUserDataRepository, rowToDocument} from './supabaseUserDataRepository';
import type {
  UserAppDocumentRow,
  UserDataClient,
  UserDataClientOptions,
  UserDocument,
  UserDocumentChange,
} from './types';

const DEVICE_ID_LS_KEY = 'cadauto.userData.deviceId';

function resolveDeviceId(explicit?: string): string | null {
  if (explicit) return explicit;
  if (typeof window === 'undefined') return null;
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_LS_KEY);
    if (existing) return existing;
    const fresh =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(DEVICE_ID_LS_KEY, fresh);
    return fresh;
  } catch {
    return null;
  }
}

interface ChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: UserAppDocumentRow | null;
  old: UserAppDocumentRow | null;
}

/**
 * Generic user-data client for microapps on cadautoscript.com (spec §FR-10).
 *
 * Example:
 *   const userData = createUserDataClient({appSlug: 'blind-flange-calculator'});
 *   await userData.saveDocument('saved-calcs', id, {input, result});
 *   const saved = await userData.listDocuments('saved-calcs');
 *
 * For Focus Planner-style apps with timer ops, transactional invariants,
 * and offline-first UX, use dedicated tables instead. This client is for
 * lightweight per-user JSONB blobs.
 */
export function createUserDataClient(options: UserDataClientOptions): UserDataClient {
  const appSlug = options.appSlug.trim();
  if (!appSlug) throw new Error('createUserDataClient: appSlug is required');

  const deviceId = resolveDeviceId(options.deviceId);
  const repo = createSupabaseUserDataRepository({appSlug, deviceId});

  function isOwnEcho(row: UserAppDocumentRow | null): boolean {
    if (!row || !deviceId) return false;
    return row.device_id === deviceId;
  }

  function buildChange<TData extends Record<string, unknown>>(
    payload: ChangePayload,
  ): UserDocumentChange<TData> | null {
    const {eventType, new: newRow, old: oldRow} = payload;

    if (eventType === 'DELETE') {
      // Postgres logical replication delivers only PK columns in `old` by
      // default — that is enough for the consumer to identify the document.
      if (!oldRow) return null;
      return {
        kind: 'deleted',
        collection: oldRow.collection,
        documentId: oldRow.document_id,
        current: null,
        previous: rowToDocument<TData>(oldRow),
      };
    }

    if (!newRow) return null;

    // An UPDATE that sets `deleted_at` is a soft-delete from the consumer's
    // perspective; translate accordingly so callers can drop it from lists.
    if (newRow.deleted_at) {
      return {
        kind: 'deleted',
        collection: newRow.collection,
        documentId: newRow.document_id,
        current: null,
        previous: oldRow ? rowToDocument<TData>(oldRow) : null,
      };
    }

    return {
      kind: eventType === 'INSERT' ? 'created' : 'updated',
      collection: newRow.collection,
      documentId: newRow.document_id,
      current: rowToDocument<TData>(newRow),
      previous: oldRow ? rowToDocument<TData>(oldRow) : null,
    };
  }

  return {
    appSlug,

    async saveDocument(collection, documentId, data) {
      return repo.upsert(collection, documentId, data);
    },

    async getDocument(collection, documentId) {
      return repo.getOne(collection, documentId);
    },

    async listDocuments(collection) {
      return repo.list(collection);
    },

    async deleteDocument(collection, documentId) {
      await repo.softDelete(collection, documentId);
    },

    subscribe<TData extends Record<string, unknown>>(
      collection: string,
      callback: (change: UserDocumentChange<TData>) => void,
    ): () => void {
      const client = repo.getClient();
      // Filter server-side by app_slug (Realtime only supports one filter
      // expression per binding); narrow to collection client-side below.
      const channel: RealtimeChannel = client.channel(
        `user-data:${appSlug}:${collection}:${Math.random().toString(36).slice(2, 10)}`,
      );

      channel.on(
        // supabase-js TS overloads expect a literal; runtime accepts the
        // generic 'postgres_changes' event string.
        'postgres_changes' as 'system',
        {
          event: '*',
          schema: 'public',
          table: 'user_app_documents',
          filter: `app_slug=eq.${appSlug}`,
        } as unknown as {event: 'system'},
        (raw: unknown) => {
          const payload = raw as ChangePayload;
          const source = payload.new ?? payload.old;
          if (!source) return;
          if (source.collection !== collection) return;
          if (isOwnEcho(payload.new ?? payload.old)) return;
          const change = buildChange<TData>(payload);
          if (change) callback(change);
        },
      );

      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[userData] channel status:', status, {appSlug, collection});
        }
      });

      return () => {
        void client.removeChannel(channel);
      };
    },

    async syncNow(): Promise<void> {
      // No local outbox in the generic client. Reserved for parity with
      // future apps that adopt a sync queue.
    },
  } satisfies UserDataClient & {appSlug: string};
}

export type {UserDataClient} from './types';

/** Convenience helper for one-shot reads where you don't want to manage
 *  a client instance. Behaves like `getDocument` but creates an ephemeral
 *  client. Useful in unit tests / playgrounds. */
export async function readUserDocumentOnce<TData extends Record<string, unknown>>(
  appSlug: string,
  collection: string,
  documentId: string,
): Promise<UserDocument<TData> | null> {
  const client = createUserDataClient({appSlug});
  return client.getDocument<TData>(collection, documentId);
}
