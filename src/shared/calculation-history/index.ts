import {supabase} from '@site/src/lib/supabaseClient';
import {SHARE_SCHEMA_VERSION} from '@site/src/lib/utilityShare';

/**
 * Saved calculation history (issue #115).
 *
 * Entries store a utility's input state in the same versioned envelope as
 * share links, so "reopen" is just navigating to the tool with a `?calc=`
 * token. Results are never persisted — the tool recomputes them.
 *
 * Access is per-user by RLS; this module never passes a user id from the
 * client for reads or deletes.
 */

export type CalculationHistoryEntry = {
  id: string;
  utilityId: string;
  schemaVersion: number;
  state: unknown;
  label: string | null;
  createdAt: string;
};

type HistoryRow = {
  id: string;
  utility_id: string;
  schema_version: number | null;
  state: unknown;
  label: string | null;
  created_at: string;
};

/** Entries beyond this are evicted server-side, oldest first. */
export const MAX_HISTORY_ENTRIES = 50;

const MAX_LABEL_LENGTH = 120;
const MAX_STATE_CHARS = 8000;

function normalize(row: HistoryRow): CalculationHistoryEntry {
  return {
    id: row.id,
    utilityId: row.utility_id,
    schemaVersion: row.schema_version ?? SHARE_SCHEMA_VERSION,
    state: row.state,
    label: row.label,
    createdAt: row.created_at,
  };
}

export async function listCalculationHistory(): Promise<CalculationHistoryEntry[]> {
  const {data, error} = await supabase
    .from('user_calculation_history')
    .select('id, utility_id, schema_version, state, label, created_at')
    .order('created_at', {ascending: false});

  if (error) {
    throw new Error(`listCalculationHistory: ${error.message}`);
  }

  return ((data ?? []) as HistoryRow[]).map(normalize);
}

/**
 * Persists a snapshot for the signed-in user. `userId` is required because the
 * insert policy checks it against `auth.uid()`; a mismatch is rejected by the
 * database rather than trusted from here.
 */
export async function saveCalculation(params: {
  userId: string;
  utilityId: string;
  state: unknown;
  label?: string | null;
}): Promise<void> {
  const utilityId = params.utilityId.trim();
  if (!utilityId) {
    throw new Error('saveCalculation: utilityId is required');
  }
  if (params.state === null || params.state === undefined) {
    throw new Error('saveCalculation: nothing to save');
  }

  const serialized = JSON.stringify(params.state);
  if (serialized.length > MAX_STATE_CHARS) {
    throw new Error('saveCalculation: state too large to store');
  }

  const label = params.label?.trim().slice(0, MAX_LABEL_LENGTH) || null;

  const {error} = await supabase.from('user_calculation_history').insert({
    user_id: params.userId,
    utility_id: utilityId,
    schema_version: SHARE_SCHEMA_VERSION,
    state: params.state,
    label,
  });

  if (error) {
    throw new Error(`saveCalculation: ${error.message}`);
  }
}

export async function deleteCalculation(id: string): Promise<void> {
  const {error} = await supabase.from('user_calculation_history').delete().eq('id', id);

  if (error) {
    throw new Error(`deleteCalculation: ${error.message}`);
  }
}
