/**
 * @file middleware.ts — Next.js root middleware for auth-aware routing.
 * @module root
 *
 * Runs on every request matching the `config.matcher` below. Refreshes the
 * Supabase session cookie via the helper, then enforces:
 *
 *   - Unauthenticated user hitting /app/* or /onboarding → redirect to
 *     /auth/login?redirect=<original-path>
 *   - Authenticated user hitting /auth/login or /auth/signup → redirect to
 *     /app/dashboard (no point showing auth pages to logged-in users)
 *
 * The matcher excludes static assets to avoid running auth checks on
 * Next.js internal routes and image assets.
 *
 * @dependencies next/server, @/lib/supabase/middleware
 * @related lib/supabase/middleware.ts, app/auth/*, app/(app)/*
 */

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/app", "/onboarding"];
const AUTH_PAGES = ["/auth/login", "/auth/signup"];

export async function middleware(request: NextRequest) {
  const { user, response } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    path === prefix || path.startsWith(`${prefix}/`),
  );
  const isAuthPage = AUTH_PAGES.includes(path);

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all routes except static assets and Next.js internals.
     * Pattern excludes: _next/static, _next/image, favicon, image extensions.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
