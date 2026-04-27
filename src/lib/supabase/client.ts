/**
 * @file client.ts — Browser-side Supabase client.
 * @module lib/supabase
 *
 * Used inside 'use client' components. Reads NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY directly from process.env (Next.js inlines
 * NEXT_PUBLIC_* at build time, so this works in the browser bundle).
 *
 * NEVER import lib/env from here — that file reads server-only secrets and
 * would break the browser bundle.
 *
 * @dependencies @supabase/ssr
 * @related lib/supabase/server.ts, lib/supabase/middleware.ts
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
