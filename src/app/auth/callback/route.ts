/**
 * @file route.ts — OAuth + magic-link callback handler.
 * @module app/auth/callback
 *
 * Receives ?code=... from Supabase after the user authorizes via Google,
 * GitHub, or clicks an email confirmation link. Exchanges the code for a
 * session cookie, then routes the user:
 *
 *   1. If `?next=` is present, honor it (used for deep-linking through OAuth)
 *   2. Else if user already has a business → /dashboard
 *   3. Else → /onboarding
 *
 * On any error, redirects back to /auth/login with the error message in a
 * query param so the form can surface it.
 *
 * @dependencies next/server, @/lib/supabase/server, @/lib/auth/getCurrentBusiness, @/lib/logger
 * @related components/auth/OAuthButtons.tsx, lib/auth/getCurrentBusiness.ts
 */

import { NextResponse, type NextRequest } from "next/server";

import { getCurrentBusiness } from "@/lib/auth/getCurrentBusiness";
import { createLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

const log = createLogger("AUTH");

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  if (!code) {
    log.warn("Callback hit without code param");
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_code", request.url),
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    log.error("exchangeCodeForSession failed", { error: error.message });
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(error.message)}`,
        request.url,
      ),
    );
  }

  if (next) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  const result = await getCurrentBusiness();
  const target = result?.business ? "/dashboard" : "/onboarding";
  log.info("Auth callback resolved", { target });
  return NextResponse.redirect(new URL(target, request.url));
}
