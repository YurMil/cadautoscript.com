/**
 * Shared user-data SDK — public types.
 *
 * Spec: Focus-Planner/docs/technical_spec_focus_planner_user_data_sync_en.md
 *       §FR-10, §10, §25.
 *
 * The cloud table `user_app_documents` keys documents by the composite
 *   (user_id, app_slug, collection, document_id)
 * with RLS confining reads/writes to the authenticated owner.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Row stored in the `user_app_documents` Supabase table. */
export interface UserAppDocumentRow {
  id: string;
  user_id: string;
  app_slug: string;
  collection: string;
  document_id: string;
  data: Json;
  client_id: string | null;
  device_id: string | null;
  created_at: string;
  updated_at: string;
  server_updated_at: string;
  version: number;
  deleted_at: string | null;
}

/** User-facing shape returned by the SDK (camelCase + parsed data). */
export interface UserDocument<TData = Record<string, unknown>> {
  id: string;
  collection: string;
  documentId: string;
  data: TData;
  createdAt: string;
  updatedAt: string;
  serverUpdatedAt: string;
  version: number;
}

export type UserDocumentChangeKind = 'created' | 'updated' | 'deleted';

export interface UserDocumentChange<TData = Record<string, unknown>> {
  kind: UserDocumentChangeKind;
  collection: string;
  documentId: string;
  /** Present for `created`/`updated`. */
  current: UserDocument<TData> | null;
  /** Present for `updated`/`deleted` when the row was previously known. */
  previous: UserDocument<TData> | null;
}

export interface UserDataClientOptions {
  /** Logical namespace, e.g. `'blind-flange-calculator'`. Must be a non-empty
   *  string; matches the `app_slug` column. */
  appSlug: string;
  /** Optional fixed deviceId. If omitted, the SDK reads/creates one from
   *  `localStorage` under `cadauto.userData.deviceId`. */
  deviceId?: string;
}

export interface UserDataClient {
  /** Slug bound at construction. Returned for debugging / logging only. */
  readonly appSlug: string;

  /** Insert or replace a document. Returns the canonical row. Throws if
   *  the user is not signed in. */
  saveDocument<TData extends Record<string, unknown>>(
    collection: string,
    documentId: string,
    data: TData,
  ): Promise<UserDocument<TData>>;

  /** Returns the document or `null` if it does not exist (or was deleted). */
  getDocument<TData extends Record<string, unknown>>(
    collection: string,
    documentId: string,
  ): Promise<UserDocument<TData> | null>;

  /** Returns all live documents in a collection. Sorted by updated_at desc. */
  listDocuments<TData extends Record<string, unknown>>(
    collection: string,
  ): Promise<UserDocument<TData>[]>;

  /** Soft-delete a document. No-op if it does not exist. */
  deleteDocument(collection: string, documentId: string): Promise<void>;

  /** Subscribe to remote changes for a collection. Returns an unsubscribe fn.
   *
   *  Note: same-device echoes are filtered out client-side using the row's
   *  `device_id` column — same behavior as the Focus Planner Realtime layer.
   */
  subscribe<TData extends Record<string, unknown>>(
    collection: string,
    callback: (change: UserDocumentChange<TData>) => void,
  ): () => void;

  /** Reserved for parity with the Focus Planner sync engine. The generic
   *  client has no local outbox, so this is a no-op today. */
  syncNow(): Promise<void>;
}
