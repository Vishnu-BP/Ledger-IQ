/**
 * @file CtaBanner.tsx — Full-width conversion banner above the footer.
 * @module components/landing
 *
 * Inverted primary-colored section with headline, supporting copy,
 * a CTA button, and three stat callouts to drive sign-ups.
 *
 * @dependencies next/link, lucide-react
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ─── Sub-component ─────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-2xl font-extrabold tracking-tight">{value}</span>
      <span className="text-xs text-primary-foreground/60">{label}</span>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────

export function CtaBanner() {
  return (
    <section className="bg-primary px-6 py-20 text-primary-foreground">
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Stop paying your CA to do spreadsheet work.
        </h2>
        <p className="mx-auto max-w-xl text-primary-foreground/70">
          LedgerIQ does the data entry, the categorization, and the GST prep.
          Your CA reviews and signs off. That&apos;s the right division of labor.
        </p>

        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 rounded-md bg-primary-foreground px-7 py-3.5 text-sm font-semibold text-primary shadow-lg transition hover:opacity-90"
        >
          Start free — takes 2 minutes
          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 border-t border-primary-foreground/20 pt-8">
          <Stat value="&lt; 90s" label="to categorize 200 transactions" />
          <Stat value="₹0" label="to get started — forever free tier" />
          <Stat value="GSTR-3B" label="pre-filled from your CSV" />
        </div>
      </div>
    </section>
  );
}
