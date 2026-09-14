// Behavioural checks for supabase/migrations/20260915000000_create_workspaces.sql
// on a real Postgres (PGlite, in-process WASM) with a minimal Supabase scaffold:
// API roles, auth.users and auth.uid() driven by request.jwt.claim.sub.
//
// Run with: pnpm test:db
import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const MIGRATION = new URL('../migrations/20260915000000_create_workspaces.sql', import.meta.url);
const db = new PGlite();

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  -- Supabase grants table/function privileges to API roles by default.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);

await db.exec(fs.readFileSync(MIGRATION, 'utf8'));

const U = {
  alice: '00000000-0000-4000-8000-00000000000a',
  bob: '00000000-0000-4000-8000-00000000000b',
  carol: '00000000-0000-4000-8000-00000000000c',
  mallory: '00000000-0000-4000-8000-00000000000d',
};
await db.exec(`
  insert into auth.users (id, email, raw_user_meta_data) values
    ('${U.alice}', 'alice@example.com', '{"full_name":"Alice Engineer"}'),
    ('${U.bob}', 'bob.smith@example.com', '{}'),
    ('${U.carol}', 'carol@example.com', '{}'),
    ('${U.mallory}', 'mallory@example.com', '{}');
`);

let passed = 0;
const as = async (who, sql, params = []) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${who ? U[who] : ''}', false);`);
  await db.exec(who ? 'set role authenticated' : 'set role anon');
  try {
    return (await db.query(sql, params)).rows;
  } finally {
    await db.exec('reset role');
  }
};
const fails = async (label, who, sql, params, pattern) => {
  await assert.rejects(() => as(who, sql, params), pattern, label);
  passed += 1;
};
const check = (label, cond) => {
  assert.ok(cond, label);
  passed += 1;
};

// --- create ----------------------------------------------------------------
const [{create_workspace: ws}] = await as('alice', 'select public.create_workspace($1)', ['  Vessel team  ']);
const alicesView = await as('alice', 'select name from public.workspaces');
check('owner sees the new workspace with a trimmed name', alicesView.length === 1 && alicesView[0].name === 'Vessel team');
const owner = await as('alice', 'select role, display_name from public.workspace_members');
check('creator is owner, named from auth metadata', owner[0].role === 'owner' && owner[0].display_name === 'Alice Engineer');
await fails('anon cannot create', null, 'select public.create_workspace($1)', ['x'], /permission denied|Not authenticated/);
await fails('empty name rejected', 'alice', 'select public.create_workspace($1)', ['   '], /check constraint/);

// --- isolation ---------------------------------------------------------------
check('non-member sees no workspace', (await as('mallory', 'select * from public.workspaces')).length === 0);
check('non-member sees no members', (await as('mallory', 'select * from public.workspace_members')).length === 0);
await fails('non-member cannot invite', 'mallory', 'select public.create_workspace_invite($1)', [ws], /Not authorized/);
await fails('invites table is not readable', 'alice', 'select * from public.workspace_invites', [], /permission denied/);
await fails('members cannot be inserted directly', 'mallory',
  'insert into public.workspace_members (workspace_id, user_id, role, display_name) values ($1, $2, $3, $4)',
  [ws, U.mallory, 'owner', 'x'], /permission denied/);

// --- invite & join -----------------------------------------------------------
const [{create_workspace_invite: code}] = await as('alice', 'select public.create_workspace_invite($1)', [ws]);
check('invite code is 64 hex chars', /^[0-9a-f]{64}$/.test(code));
const stored = await db.query('select code_hash from public.workspace_invites');
check('only the hash of the code is stored', stored.rows[0].code_hash !== code && stored.rows[0].code_hash.length === 64);

await fails('wrong code rejected', 'bob', 'select public.accept_workspace_invite($1)', ['0'.repeat(64)], /invalid or has expired/);
const [{accept_workspace_invite: joined}] = await as('bob', 'select public.accept_workspace_invite($1)', [code]);
check('bob joins the workspace', joined === ws);
await as('bob', 'select public.accept_workspace_invite($1)', [code]);
check('accepting twice is idempotent', (await db.query('select count(*)::int n from public.workspace_members where user_id = $1', [U.bob])).rows[0].n === 1);
const bobRow = (await as('bob', 'select role, display_name from public.workspace_members where user_id = $1', [U.bob]))[0];
check('joiner is a member named from e-mail local part', bobRow.role === 'member' && bobRow.display_name === 'bob.smith');
await fails('member cannot invite', 'bob', 'select public.create_workspace_invite($1)', [ws], /Not authorized/);

// --- defaults ----------------------------------------------------------------
await as('alice', 'update public.workspaces set company_name = $1, preferred_standards = $2 where id = $3', ['ACME Vessels', 'EN 13445', ws]);
const defaults = (await as('bob', 'select company_name, preferred_standards from public.workspaces'))[0];
check('members see owner-set report defaults', defaults.company_name === 'ACME Vessels' && defaults.preferred_standards === 'EN 13445');
const bobUpdate = await as('bob', 'update public.workspaces set company_name = $1 where id = $2 returning id', ['Hijacked', ws]);
check('member update affects no rows', bobUpdate.length === 0);
await fails('owner cannot change created_by', 'alice', 'update public.workspaces set created_by = $1', [U.mallory], /permission denied/);

// --- shared history ------------------------------------------------------------
await as('bob', `insert into public.workspace_calculations (workspace_id, created_by, utility_id, state, label)
                 values ($1, $2, 'shell-rolling', '{"v":1}', 'Shell')`, [ws, U.bob]);
const shared = await as('alice', 'select created_by, created_by_name from public.workspace_calculations');
check('owner sees the member entry, attributed server-side', shared.length === 1 && shared[0].created_by === U.bob && shared[0].created_by_name === 'bob.smith');
await fails('cannot save on behalf of another member', 'bob',
  `insert into public.workspace_calculations (workspace_id, created_by, utility_id, state) values ($1, $2, 'x', '{}')`,
  [ws, U.alice], /row-level security/);
await fails('non-member cannot save into the workspace', 'mallory',
  `insert into public.workspace_calculations (workspace_id, created_by, utility_id, state) values ($1, $2, 'x', '{}')`,
  [ws, U.mallory], /row-level security/);
await fails('author name cannot be forged', 'bob',
  `insert into public.workspace_calculations (workspace_id, created_by, created_by_name, utility_id, state) values ($1, $2, 'Alice', 'x', '{}')`,
  [ws, U.bob], /permission denied/);
await fails('entries are immutable', 'bob', `update public.workspace_calculations set label = 'x'`, [], /permission denied/);
check('non-member reads no shared entries', (await as('mallory', 'select * from public.workspace_calculations')).length === 0);

await as('alice', `insert into public.workspace_calculations (workspace_id, created_by, utility_id, state) values ($1, $2, 'blind-flange-calculator', '{}')`, [ws, U.alice]);
const bobDeletesAlice = await as('bob', 'delete from public.workspace_calculations where created_by = $1 returning id', [U.alice]);
check('member cannot delete another member entry', bobDeletesAlice.length === 0);
const aliceDeletesBob = await as('alice', 'delete from public.workspace_calculations where created_by = $1 returning id', [U.bob]);
check('owner can delete any entry', aliceDeletesBob.length === 1);

// --- removal, ownership hand-over, deletion -------------------------------------
const [{create_workspace_invite: code2}] = await as('alice', 'select public.create_workspace_invite($1)', [ws]);
await as('carol', 'select public.accept_workspace_invite($1)', [code2]);
await fails('member cannot remove others', 'bob', 'select public.remove_workspace_member($1, $2)', [ws, U.carol], /Not authorized/);
await as('alice', 'select public.remove_workspace_member($1, $2)', [ws, U.carol]);
check('owner removes a member', (await as('carol', 'select * from public.workspaces')).length === 0);

await as('alice', 'select public.revoke_workspace_invites($1)', [ws]);
await fails('revoked invite no longer works', 'carol', 'select public.accept_workspace_invite($1)', [code2], /invalid or has expired/);

await db.exec(`update public.workspace_invites set expires_at = now() - interval '1 second'`);
await as('alice', 'select public.create_workspace_invite($1)', [ws]);
check('expired and revoked invites are purged on next invite', (await db.query('select count(*)::int n from public.workspace_invites')).rows[0].n === 1);
await db.exec(`update public.workspace_invites set expires_at = now() - interval '1 second'`);
const expiredCode = (await as('alice', 'select public.create_workspace_invite($1) c', [ws]))[0].c;
await db.exec(`update public.workspace_invites set expires_at = now() - interval '1 second'`);
await fails('expired invite rejected', 'carol', 'select public.accept_workspace_invite($1)', [expiredCode], /invalid or has expired/);

await as('alice', 'select public.leave_workspace($1)', [ws]);
const afterLeave = await db.query('select user_id, role from public.workspace_members where workspace_id = $1', [ws]);
check('owner leaving promotes the remaining member', afterLeave.rows.length === 1 && afterLeave.rows[0].user_id === U.bob && afterLeave.rows[0].role === 'owner');
check('entries of a departed member stay attributed', (await as('bob', 'select created_by_name from public.workspace_calculations'))[0]?.created_by_name === 'Alice Engineer');

await as('bob', 'select public.leave_workspace($1)', [ws]);
check('last member leaving deletes the workspace', (await db.query('select count(*)::int n from public.workspaces')).rows[0].n === 0);
check('deleting the workspace cascades shared entries', (await db.query('select count(*)::int n from public.workspace_calculations')).rows[0].n === 0);

// account deletion hands ownership over
const [{create_workspace: ws2}] = await as('carol', 'select public.create_workspace($1)', ['Pipes']);
const inv = (await as('carol', 'select public.create_workspace_invite($1) c', [ws2]))[0].c;
await as('mallory', 'select public.accept_workspace_invite($1)', [inv]);
await db.exec(`delete from auth.users where id = '${U.carol}'`);
const ws2Members = await db.query('select user_id, role from public.workspace_members where workspace_id = $1', [ws2]);
check('owner account deletion promotes a member', ws2Members.rows.length === 1 && ws2Members.rows[0].role === 'owner');

await fails('member cannot delete the workspace', null, 'select public.delete_workspace($1)', [ws2], /permission denied|Not authenticated/);
await as('mallory', 'select public.delete_workspace($1)', [ws2]);
check('owner deletes the workspace', (await db.query('select count(*)::int n from public.workspaces')).rows[0].n === 0);

// --- limits -------------------------------------------------------------------
for (let i = 0; i < 10; i += 1) await as('alice', 'select public.create_workspace($1)', [`W${i}`]);
await fails('owned workspace limit', 'alice', 'select public.create_workspace($1)', ['W10'], /limit reached/);

const [{id: big}] = (await db.query('select id from public.workspaces limit 1')).rows;
for (let i = 0; i < 205; i += 1) {
  await as('alice', `insert into public.workspace_calculations (workspace_id, created_by, utility_id, state) values ($1, $2, 'x', '{}')`, [big, U.alice]);
}
check('shared history is capped at 200', (await db.query('select count(*)::int n from public.workspace_calculations where workspace_id = $1', [big])).rows[0].n === 200);

// --- functions not callable by API roles ----------------------------------------
await fails('internal display-name helper is not callable', 'alice', 'select public.workspace_display_name($1)', [U.bob], /permission denied/);
await fails('trigger function is not callable', 'alice', 'select public.trim_workspace_calculations()', [], /permission denied|trigger functions can only be called/);

console.log(`ALL ${passed} CHECKS PASSED`);
