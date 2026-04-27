import "server-only";

/**
 * @file admin.ts — Service-role Supabase client (bypasses RLS).
 * @module lib/supabase
 *
 * Used by server-side code that needs unrestricted access — Storage uploads,
 * cross-business queries (none yet), maintenance tasks. The service role key
 * is loaded from server-only env via @/lib/env, and the `server-only` import
 * at the top makes accidental client-side import fail at build time.
 *
 * Distinct from `lib/supabase/server.ts` which uses the anon key + cookies
 * for user-scoped requests.
 *
 * @dependencies @supabase/supabase-js, @/lib/env
 * @related lib/storage/supabaseStorage.ts, app/api/upload/route.ts
 */

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

export function createAdminClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
