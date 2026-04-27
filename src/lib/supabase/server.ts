/**
 * @file server.ts — Server-side Supabase client (RSC + Route Handlers).
 * @module lib/supabase
 *
 * Each call returns a fresh client wired to Next.js cookies(). The setAll()
 * try/catch swallows the expected "cannot set cookies in RSC" error — Server
 * Components can read cookies but not write them; route handlers can write.
 * The middleware ensures cookies stay refreshed in the response either way.
 *
 * @dependencies @supabase/ssr, next/headers, @/lib/env
 * @related lib/supabase/client.ts, lib/supabase/middleware.ts
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll() called from a Server Component — ignore.
            // Cookie writes are handled by middleware on response, so this
            // path is safe to no-op.
          }
        },
      },
    },
  );
}
