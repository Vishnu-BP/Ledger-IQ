/**
 * @file DemoAnomalies.tsx — Static anomaly list mockup for the demo section.
 * @module components/landing
 *
 * Shows four mock anomalies with severity badges and AI explanations,
 * mirroring the visual structure of the real AnomalyPanel component.
 *
 * @related components/landing/DemoSection.tsx, components/dashboard/AnomalyPanel.tsx
 */

import { AlertTriangle, Copy, TrendingUp } from "lucide-react";
import { SectionHeading, SectionLabel } from "@/components/landing/_shared";
import { cn } from "@/lib/utils";

// ─── Types & Data ──────────────────────────────────────────

interface Anomaly {
  severity: "high" | "medium";
  title: string;
  explanation: string;
}

const ANOMALIES: Anomaly[] = [
  {
    severity: "high",
    title: "Duplicate debit — Swiggy ₹847 on 09 Apr and 10 Apr",
    explanation:
      "Two identical UPI debit entries for SWIGGY ORDER appear within 24 hours, suggesting a double-charge. Verify with Swiggy support and request a refund for the duplicate transaction.",
  },
  {
    severity: "high",
    title: "Amazon under-paid ₹1,260 in Apr Week-1 settlement",
    explanation:
      "Commission reversal for 2 returned orders is missing and referral fee was over-deducted on 1 Electronics order. Total shortfall ₹1,260 — raise a dispute via Seller Central.",
  },
  {
    severity: "medium",
    title: "Vendor spend spike — Rajesh Suppliers up 340% vs last month",
    explanation:
      "Raw material payments jumped from ₹12,400 in March to ₹55,000 in April. Verify this matches a purchase order or flag as an unauthorized payment before month-end close.",
  },
  {
    severity: "medium",
    title: "Missing recurring — Tally subscription not seen this month",
    explanation:
      "A ₹1,499 monthly debit for Tally Solutions has appeared every month for 8 months but is absent in April 2025. Check if the subscription was cancelled or the bank narration changed.",
  },
];

// ─── Component ─────────────────────────────────────────────

export function DemoAnomalies() {
  return (
    <section id="demo-anomalies" className="scroll-mt-32 bg-muted/30 px-6 py-20">
      <div className="mx-auto max-w-5xl space-y-4">
        <SectionLabel>Anomaly Radar</SectionLabel>
        <SectionHeading>Catch what the spreadsheet can&apos;t</SectionHeading>
        <p className="text-sm text-muted-foreground">
          Duplicates, missing recurring payments, vendor-spend spikes, and
          marketplace shortfalls — surfaced automatically and explained by AI.
        </p>

        <ul className="space-y-3">
          {ANOMALIES.map((a) => (
            <li
              key={a.title}
              className="flex items-start gap-3 rounded-lg border bg-card p-4"
            >
              {/* Icon */}
              <div
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  a.severity === "high"
                    ? "bg-destructive/10"
                    : "bg-amber-500/10",
                )}
              >
                {a.severity === "high" ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{a.title}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      a.severity === "high"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                    )}
                  >
                    {a.severity}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {a.explanation}
                </p>
              </div>

              {/* Decorative dismiss button */}
              <button
                disabled
                className="shrink-0 rounded-md border px-2.5 py-1 text-xs text-muted-foreground opacity-50 cursor-default"
              >
                Dismiss
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
