import type {SupabaseClient} from '@supabase/supabase-js';
import {supabase as defaultClient} from '@site/src/lib/supabaseClient';
import type {Json, UserAppDocumentRow, UserDocument} from './types';

/**
 * Thin transport layer over the `user_app_documents` Supabase table.
 *
 * Errors propagate as regular `Error` instances so the calling SDK layer
 * can wrap them with context. All operations rely on the user's
 * `auth.uid()` via RLS; this module never accepts a user_id argument.
 */

const TABLE = 'user_app_documents';

function rowToDocument<TData extends Record<string, unknown>>(
  row: UserAppDocumentRow,
): UserDocument<TData> {
  return {
    id: row.id,
    collection: row.collection,
    documentId: row.document_id,
    data: (row.data ?? {}) as TData,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    serverUpdatedAt: row.server_updated_at,
    version: row.version,
  };
}

async function requireUserId(client: SupabaseClient): Promise<string> {
  const {data, error} = await client.auth.getUser();
  if (error) throw new Error(`auth.getUser: ${error.message}`);
  const id = data.user?.id;
  if (!id) throw new Error('Not authenticated');
  return id;
}

export interface RepositoryOptions {
  appSlug: string;
  deviceId: string | null;
  client?: SupabaseClient;
}

export function createSupabaseUserDataRepository(opts: RepositoryOptions) {
  const client = opts.client ?? defaultClient;
  const {appSlug, deviceId} = opts;

  return {
    async upsert<TData extends Record<string, unknown>>(
      collection: string,
      documentId: string,
      data: TData,
    ): Promise<UserDocument<TData>> {
      const userId = await requireUserId(client);
      const nowIso = new Date().toISOString();
      const {data: row, error} = await client
        .from(TABLE)
        .upsert(
          {
            user_id: userId,
            app_slug: appSlug,
            collection,
            document_id: documentId,
            data: data as unknown as Json,
            device_id: deviceId,
            updated_at: nowIso,
            // Resurrect a soft-deleted document on next save.
            deleted_at: null,
          },
          {onConflict: 'user_id,app_slug,collection,document_id'},
        )
        .select('*')
        .single<UserAppDocumentRow>();
      if (error) throw new Error(`saveDocument: ${error.message}`);
      return rowToDocument<TData>(row);
    },

    async getOne<TData extends Record<string, unknown>>(
      collection: string,
      documentId: string,
    ): Promise<UserDocument<TData> | null> {
      const userId = await requireUserId(client);
      const {data, error} = await client
        .from(TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('app_slug', appSlug)
        .eq('collection', collection)
        .eq('document_id', documentId)
        .is('deleted_at', null)
        .maybeSingle<UserAppDocumentRow>();
      if (error) throw new Error(`getDocument: ${error.message}`);
      return data ? rowToDocument<TData>(data) : null;
    },

    async list<TData extends Record<string, unknown>>(
      collection: string,
    ): Promise<UserDocument<TData>[]> {
      const userId = await requireUserId(client);
      const {data, error} = await client
        .from(TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('app_slug', appSlug)
        .eq('collection', collection)
        .is('deleted_at', null)
        .order('updated_at', {ascending: false});
      if (error) throw new Error(`listDocuments: ${error.message}`);
      return ((data ?? []) as UserAppDocumentRow[]).map(rowToDocument<TData>);
    },

    async softDelete(collection: string, documentId: string): Promise<void> {
      const userId = await requireUserId(client);
      const {error} = await client
        .from(TABLE)
        .update({deleted_at: new Date().toISOString()})
        .eq('user_id', userId)
        .eq('app_slug', appSlug)
        .eq('collection', collection)
        .eq('document_id', documentId);
      if (error) throw new Error(`deleteDocument: ${error.message}`);
    },

    getClient(): SupabaseClient {
      return client;
    },
  };
}

export type SupabaseUserDataRepository = ReturnType<
  typeof createSupabaseUserDataRepository
>;

export {rowToDocument};
