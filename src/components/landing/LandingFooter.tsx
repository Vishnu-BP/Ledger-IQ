/**
 * @file LandingFooter.tsx — Minimal one-line footer for the public landing page.
 * @module components/landing
 *
 * Brand name, quick nav links, and copyright text in a single responsive row.
 *
 * @dependencies next/link
 */

import Link from "next/link";

// ─── Component ─────────────────────────────────────────────

export function LandingFooter() {
  return (
    <footer className="border-t px-6 py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <span className="font-semibold text-foreground">LedgerIQ</span>

        <div className="flex gap-4">
          <Link
            href="/auth/login"
            className="hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="hover:text-foreground transition-colors"
          >
            Get started
          </Link>
        </div>

        <span>© 2025 LedgerIQ. AI financial autopilot for Indian SMBs.</span>
      </div>
    </footer>
  );
}
