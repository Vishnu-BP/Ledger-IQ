/**
 * @file getCurrentBusiness.ts — Resolve the authenticated user's business.
 * @module lib/auth
 *
 * Returns the user + their business row (or null business if onboarding
 * incomplete), or null entirely if not authenticated. Single canonical helper
 * called by the OAuth callback and by the protected (app) layout to decide
 * whether to route to /onboarding or /dashboard.
 *
 * Bypasses RLS via the Drizzle service-role connection (DATABASE_URL) and
 * scopes the query explicitly via WHERE user_id = auth.uid(). The auth check
 * comes from supabase.auth.getUser() (JWT-validated against Auth) so the user
 * id is trustworthy.
 *
 * @dependencies @/lib/supabase/server, @/db/client, drizzle-orm
 * @related app/auth/callback/route.ts, app/(app)/layout.tsx (stage 1.6)
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { businesses } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface CurrentBusiness {
  user: { id: string; email?: string };
  business: typeof businesses.$inferSelect | null;
}

export async function getCurrentBusiness(): Promise<CurrentBusiness | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.user_id, user.id))
    .limit(1);

  return {
    user: { id: user.id, email: user.email },
    business: business ?? null,
  };
}
