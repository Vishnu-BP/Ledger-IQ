/**
 * @file middleware.ts — Helper invoked from the root Next.js middleware.
 * @module lib/supabase
 *
 * Refreshes the user's session cookie on every request and returns the
 * authenticated user (or null) plus a NextResponse with cookies attached.
 * The root middleware.ts uses this to make routing decisions.
 *
 * IMPORTANT: must call `supabase.auth.getUser()` (not getSession) — getUser
 * verifies the JWT against Supabase Auth, while getSession just reads the
 * cookie. Per Supabase guidance, only getUser is safe in middleware.
 *
 * @dependencies @supabase/ssr, next/server, @/lib/env
 * @related middleware.ts (root), lib/supabase/server.ts
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, response: supabaseResponse };
}
