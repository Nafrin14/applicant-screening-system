const { createClient } = require("@supabase/supabase-js");

// Server-only Supabase client using the SERVICE ROLE key. This bypasses Row
// Level Security and must never be exposed to the browser — it is only ever
// required from server-side route files (e.g. server/routes/salesAdmin.js).
//
// The client is created lazily (on first use) rather than at require-time so
// that a missing/misconfigured server/.env only breaks the Sales Admin
// user-management endpoints, and never crashes the whole Express process
// (which would also take down the unrelated hiring /api/ai routes).
let cachedClient = null;

function getSupabaseAdmin() {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Sales Admin user-management is not configured: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY " +
        "are missing from server/.env."
    );
  }

  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}

module.exports = { getSupabaseAdmin };
