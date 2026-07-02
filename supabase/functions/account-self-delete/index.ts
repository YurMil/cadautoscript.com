// Self-service account deletion.
//
// Deletes the *calling* user's own auth.users row using the service role, which
// cascades (ON DELETE CASCADE on every FK) to remove their profile, comments,
// reactions, settings, analytics and focus data. The audit trail is written
// separately by the `request_account_deletion` RPC *before* this runs, so the
// record of the deletion survives the cascade.
//
// Security: verify_jwt is enabled at the gateway, and we additionally resolve
// the user from the JWT here and delete ONLY that id. The request body is never
// trusted for the target, so this endpoint cannot be used to delete anyone else.
import {createClient} from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({error: 'Missing authorization header'}, 401);
    }

    // Resolve the caller from their JWT — this is the only id we will delete.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: {headers: {Authorization: authHeader}},
      auth: {persistSession: false, autoRefreshToken: false},
    });
    const {
      data: {user},
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({error: 'Not authenticated'}, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {persistSession: false, autoRefreshToken: false},
    });

    const {error: deleteError} = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('[account-self-delete] deleteUser failed', deleteError.message);
      return json({error: 'Failed to delete account'}, 500);
    }

    return json({ok: true});
  } catch (err) {
    console.error('[account-self-delete] unexpected error', err);
    return json({error: 'Unexpected error'}, 500);
  }
});
