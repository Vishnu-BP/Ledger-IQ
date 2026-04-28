/**
 * @file DemoGst.tsx — Static GSTR-3B pre-fill mockup for the demo section.
 * @module components/landing
 *
 * Shows the five GSTR-3B sections populated from mock transaction data,
 * mirroring the visual layout of the real Gstr3bView component.
 *
 * @related components/landing/DemoSection.tsx, components/reports/Gstr3bView.tsx
 */

import { Copy } from "lucide-react";
import { SectionHeading, SectionLabel } from "@/components/landing/_shared";

// ─── Types & Data ──────────────────────────────────────────

interface GstRow {
  label: string;
  value: string;
}

interface GstBlock {
  section: string;
  title: string;
  rows: GstRow[];
}

const GST_BLOCKS: GstBlock[] = [
  {
    section: "3.1",
    title: "Outward Supplies",
    rows: [
      { label: "Gross sales (incl. GST)", value: "₹8,24,500" },
      { label: "Taxable value", value: "₹6,98,729" },
      { label: "Output GST", value: "₹1,25,771" },
    ],
  },
  {
    section: "4A",
    title: "Eligible ITC",
    rows: [
      { label: "Total eligible ITC", value: "₹44,200" },
      { label: "ITC on Goods", value: "₹31,500" },
      { label: "ITC on Services", value: "₹12,700" },
    ],
  },
  {
    section: "4B",
    title: "Blocked ITC",
    rows: [{ label: "Blocked ITC (rule 17)", value: "₹3,840" }],
  },
  {
    section: "5",
    title: "Exempt / Nil-rated Turnover",
    rows: [{ label: "Exempt / out-of-scope", value: "₹52,000" }],
  },
  {
    section: "6.1",
    title: "Net GST Payable",
    rows: [{ label: "Output − Eligible ITC", value: "₹81,571" }],
  },
];

// ─── Component ─────────────────────────────────────────────

export function DemoGst() {
  return (
    <section
      id="demo-gst"
      className="scroll-mt-32 bg-muted/30 px-6 py-20"
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <SectionLabel>GST Pre-fill</SectionLabel>
        <SectionHeading>GSTR-3B ready in seconds</SectionHeading>
        <p className="text-sm text-muted-foreground">
          Sections 3.1, 4A, 4B, 5, and 6.1 — populated automatically from your
          categorized transactions. Copy figures straight into the GST portal.
        </p>
        <p className="text-xs text-muted-foreground">
          Aggregated from 247 transactions · Period: Apr 2025
        </p>

        {/* Section cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GST_BLOCKS.map((block) => (
            <div key={block.section} className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  §{block.section} — {block.title}
                </span>
              </div>
              <div className="divide-y">
                {block.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <span className="text-xs text-muted-foreground">
                      {row.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        {row.value}
                      </span>
                      {/* Decorative copy icon — non-functional in demo */}
                      <Copy className="h-3 w-3 cursor-pointer text-muted-foreground/50 hover:text-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
