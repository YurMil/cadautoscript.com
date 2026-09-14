import {supabase} from '@site/src/lib/supabaseClient';
import {SHARE_SCHEMA_VERSION} from '@site/src/lib/utilityShare';

/**
 * Shared workspaces (issue #122).
 *
 * Access is enforced in the database (supabase/migrations/20260915000000):
 * membership gates every read, structural changes go through security definer
 * RPCs that take the caller from auth.uid(), and shared entries are attributed
 * server-side. Nothing here is a security boundary.
 */

export type WorkspaceRole = 'owner' | 'member';

export type WorkspaceMember = {
  userId: string;
  role: WorkspaceRole;
  displayName: string;
  joinedAt: string;
};

export type Workspace = {
  id: string;
  name: string;
  companyName: string | null;
  preferredStandards: string | null;
  members: WorkspaceMember[];
};

export type WorkspaceCalculation = {
  id: string;
  workspaceId: string;
  utilityId: string;
  state: unknown;
  label: string | null;
  createdBy: string | null;
  createdByName: string;
  createdAt: string;
};

export type ReportDefaults = {
  companyName: string | null;
  preferredStandards: string | null;
};

export const MAX_WORKSPACE_ENTRIES = 200;
export const WORKSPACE_NAME_MAX = 80;
export const COMPANY_NAME_MAX = 120;
export const PREFERRED_STANDARDS_MAX = 200;
// Not 'code': supabase-js treats ?code= as an OAuth PKCE code and tries to
// exchange it for a session on page load.
export const INVITE_PARAM = 'invite';

const MAX_LABEL_LENGTH = 120;
const MAX_STATE_CHARS = 8000;

type WorkspaceRow = {
  id: string;
  name: string;
  company_name: string | null;
  preferred_standards: string | null;
  workspace_members: {user_id: string; role: WorkspaceRole; display_name: string; joined_at: string}[] | null;
};

type CalculationRow = {
  id: string;
  workspace_id: string;
  utility_id: string;
  state: unknown;
  label: string | null;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
};

function fail(scope: string, message: string): never {
  throw new Error(`${scope}: ${message}`);
}

export function getMyRole(workspace: Workspace, userId: string | null | undefined): WorkspaceRole | null {
  if (!userId) return null;
  return workspace.members.find((member) => member.userId === userId)?.role ?? null;
}

export async function listMyWorkspaces(): Promise<Workspace[]> {
  const {data, error} = await supabase
    .from('workspaces')
    .select('id, name, company_name, preferred_standards, workspace_members(user_id, role, display_name, joined_at)')
    .order('created_at', {ascending: true});

  if (error) fail('listMyWorkspaces', error.message);

  return ((data ?? []) as WorkspaceRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    companyName: row.company_name,
    preferredStandards: row.preferred_standards,
    members: (row.workspace_members ?? [])
      .map((member) => ({
        userId: member.user_id,
        role: member.role,
        displayName: member.display_name,
        joinedAt: member.joined_at,
      }))
      .sort((a, b) => (a.role === b.role ? a.joinedAt.localeCompare(b.joinedAt) : a.role === 'owner' ? -1 : 1)),
  }));
}

export async function createWorkspace(name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) fail('createWorkspace', 'name is required');
  const {data, error} = await supabase.rpc('create_workspace', {p_name: trimmed.slice(0, WORKSPACE_NAME_MAX)});
  if (error) fail('createWorkspace', error.message);
  return data as string;
}

export async function updateWorkspace(
  id: string,
  values: {name: string; companyName: string; preferredStandards: string},
): Promise<void> {
  const name = values.name.trim();
  if (!name) fail('updateWorkspace', 'name is required');
  const {error} = await supabase
    .from('workspaces')
    .update({
      name: name.slice(0, WORKSPACE_NAME_MAX),
      company_name: values.companyName.trim().slice(0, COMPANY_NAME_MAX) || null,
      preferred_standards: values.preferredStandards.trim().slice(0, PREFERRED_STANDARDS_MAX) || null,
    })
    .eq('id', id);
  if (error) fail('updateWorkspace', error.message);
}

/** Returns a single-display invite code; only its hash is stored. */
export async function createInviteCode(workspaceId: string): Promise<string> {
  const {data, error} = await supabase.rpc('create_workspace_invite', {p_workspace: workspaceId});
  if (error) fail('createInviteCode', error.message);
  return data as string;
}

export function buildInviteUrl(code: string): string {
  const url = new URL('/workspaces/join/', window.location.origin);
  url.searchParams.set(INVITE_PARAM, code);
  return url.toString();
}

export async function revokeInvites(workspaceId: string): Promise<void> {
  const {error} = await supabase.rpc('revoke_workspace_invites', {p_workspace: workspaceId});
  if (error) fail('revokeInvites', error.message);
}

export async function acceptInvite(code: string): Promise<string> {
  const {data, error} = await supabase.rpc('accept_workspace_invite', {p_code: code.trim()});
  if (error) fail('acceptInvite', error.message);
  return data as string;
}

export async function leaveWorkspace(workspaceId: string): Promise<void> {
  const {error} = await supabase.rpc('leave_workspace', {p_workspace: workspaceId});
  if (error) fail('leaveWorkspace', error.message);
}

export async function removeMember(workspaceId: string, userId: string): Promise<void> {
  const {error} = await supabase.rpc('remove_workspace_member', {p_workspace: workspaceId, p_user: userId});
  if (error) fail('removeMember', error.message);
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const {error} = await supabase.rpc('delete_workspace', {p_workspace: workspaceId});
  if (error) fail('deleteWorkspace', error.message);
}

export async function listWorkspaceCalculations(workspaceId: string): Promise<WorkspaceCalculation[]> {
  const {data, error} = await supabase
    .from('workspace_calculations')
    .select('id, workspace_id, utility_id, state, label, created_by, created_by_name, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', {ascending: false});

  if (error) fail('listWorkspaceCalculations', error.message);

  return ((data ?? []) as CalculationRow[]).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    utilityId: row.utility_id,
    state: row.state,
    label: row.label,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  }));
}

/**
 * Shares a snapshot with a workspace. `userId` must be the signed-in user: the
 * insert policy checks it against auth.uid(), and the author name is stamped
 * by the database.
 */
export async function saveWorkspaceCalculation(params: {
  workspaceId: string;
  userId: string;
  utilityId: string;
  state: unknown;
  label?: string | null;
}): Promise<void> {
  if (params.state === null || params.state === undefined) {
    fail('saveWorkspaceCalculation', 'nothing to save');
  }
  if (JSON.stringify(params.state).length > MAX_STATE_CHARS) {
    fail('saveWorkspaceCalculation', 'state too large to store');
  }

  const {error} = await supabase.from('workspace_calculations').insert({
    workspace_id: params.workspaceId,
    created_by: params.userId,
    utility_id: params.utilityId.trim(),
    schema_version: SHARE_SCHEMA_VERSION,
    state: params.state,
    label: params.label?.trim().slice(0, MAX_LABEL_LENGTH) || null,
  });

  if (error) fail('saveWorkspaceCalculation', error.message);
}

export async function deleteWorkspaceCalculation(id: string): Promise<void> {
  const {error} = await supabase.from('workspace_calculations').delete().eq('id', id);
  if (error) fail('deleteWorkspaceCalculation', error.message);
}

export function reportDefaultsOf(workspace: Workspace | null | undefined): ReportDefaults | null {
  if (!workspace || (!workspace.companyName && !workspace.preferredStandards)) return null;
  return {companyName: workspace.companyName, preferredStandards: workspace.preferredStandards};
}

// The save target chosen in a utility shell is remembered per browser, so a
// team member keeps saving to their team without re-selecting it every time.
const SAVE_TARGET_KEY = 'cas-save-target';
export const PERSONAL_TARGET = 'personal';

export function readSaveTarget(): string {
  try {
    return window.localStorage.getItem(SAVE_TARGET_KEY) || PERSONAL_TARGET;
  } catch {
    return PERSONAL_TARGET;
  }
}

export function writeSaveTarget(target: string): void {
  try {
    window.localStorage.setItem(SAVE_TARGET_KEY, target);
  } catch {
    /* storage unavailable: the choice simply is not remembered */
  }
}
