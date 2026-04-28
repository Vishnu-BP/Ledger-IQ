/**
 * @file DemoReconciliation.tsx — Static settlement reconciliation mockup for the demo.
 * @module components/landing
 *
 * Shows two mock settlement cards — one with Amazon discrepancies (AI-explained)
 * and one clean Flipkart settlement — mirroring the real SettlementCard layout.
 *
 * @related components/landing/DemoSection.tsx, components/reconciliation/SettlementCard.tsx
 */

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { SectionHeading, SectionLabel } from "@/components/landing/_shared";

// ─── Types & Data ──────────────────────────────────────────

interface Discrepancy {
  type: string;
  gap: string;
  expected: string;
  received: string;
  explanation: string;
}

// ─── Component ─────────────────────────────────────────────

export function DemoReconciliation() {
  const discrepancies: Discrepancy[] = [
    {
      type: "Missing commission reversal",
      gap: "₹480",
      expected: "₹480",
      received: "₹0",
      explanation:
        "Order #402-8811293-7281032 was returned by the customer but the commission reversal was not included in this settlement cycle.",
    },
    {
      type: "Referral fee discrepancy",
      gap: "₹780",
      expected: "₹4,200",
      received: "₹3,420",
      explanation:
        "Referral fee applied at 18% instead of the contracted 12% for the Electronics category. Raise a dispute via Seller Central.",
    },
  ];

  return (
    <section id="demo-reconcile" className="scroll-mt-32 px-6 py-20">
      <div className="mx-auto max-w-5xl space-y-4">
        <SectionLabel>Reconciliation</SectionLabel>
        <SectionHeading>Find the gaps Amazon doesn&apos;t tell you about</SectionHeading>
        <p className="text-sm text-muted-foreground">
          Upload your settlement report. LedgerIQ matches every line item against
          your bank credits and flags the shortfall — explained by AI.
        </p>

        <div className="space-y-4">
          {/* Settlement 1 — Amazon with discrepancies */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <p className="text-sm font-semibold">AMZ-2025-04-001</p>
                <p className="text-xs text-muted-foreground">
                  Amazon · Apr 1–14, 2025 · Deposited 17 Apr · ₹18,420
                </p>
              </div>
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                ₹1,260 gap
              </span>
            </div>

            {/* Discrepancy banner */}
            <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm font-semibold text-destructive">
                Amazon owes you ₹1,260 across 2 disputed items
              </p>
            </div>

            {/* Discrepancy rows */}
            <div className="divide-y px-5 pb-4 pt-3">
              {discrepancies.map((d) => (
                <div key={d.type} className="py-3">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm font-medium">{d.type}</span>
                    <span className="shrink-0 text-sm font-semibold text-destructive">
                      −{d.gap}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                    <span>Expected: {d.expected}</span>
                    <span>Received: {d.received}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {d.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Settlement 2 — Flipkart clean */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <p className="text-sm font-semibold">FK-APR-2025-002</p>
                <p className="text-xs text-muted-foreground">
                  Flipkart · Apr 1–7, 2025 · Deposited 10 Apr · ₹9,650
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Clean
              </span>
            </div>
            <div className="mx-5 my-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                All settled — no discrepancies found
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
