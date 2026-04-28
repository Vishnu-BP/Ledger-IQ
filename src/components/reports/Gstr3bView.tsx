"use client";

/**
 * @file Gstr3bView.tsx — GSTR-3B pre-fill view with copy buttons.
 * @module components/reports
 *
 * Renders the 5 key GSTR-3B sections. Every field has a copy button so the
 * user can paste values directly into the GST portal. All amounts in INR.
 *
 * @related lib/gst/gstr3bAggregator.ts, CopyButton.tsx
 */

import type { Gstr3bData } from "@/lib/gst/gstr3bAggregator";
import { formatINR } from "@/lib/utils";
import { CopyButton } from "./CopyButton";

interface RowProps {
  label: string;
  value: string;
  indent?: boolean;
}

function Row({ label, value, indent }: RowProps) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2 ${indent ? "pl-4" : ""}`}>
      <span className={`text-sm ${indent ? "text-muted-foreground" : "font-medium"}`}>
        {label}
      </span>
      <span className="flex items-center gap-1 font-mono text-sm tabular-nums">
        {formatINR(value)}
        <CopyButton value={value} />
      </span>
    </div>
  );
}

function Section({ title, number, children }: { title: string; number: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {number} · {title}
      </p>
      <div className="divide-y">{children}</div>
    </div>
  );
}

export function Gstr3bView({ data }: { data: Gstr3bData }) {
  if (!data.hasData) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Categorize your transactions first — GSTR-3B values will appear here once the AI has processed your statements.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Aggregated from all categorized transactions · Period: {data.period} · Click any copy icon to paste into GST portal.
      </p>

      <Section number="3.1" title="Outward Supplies (Sales)">
        <Row label="Gross sales (including GST)" value={data.outwardGrossSales} />
        <Row label="Taxable value" value={data.outwardTaxableValue} indent />
        <Row label="Output GST" value={data.outwardTax} indent />
      </Section>

      <Section number="4A" title="Eligible Input Tax Credit">
        <Row label="Total eligible ITC" value={data.itcEligible} />
        <Row label="ITC on Goods" value={data.itcGoods} indent />
        <Row label="ITC on Services" value={data.itcServices} indent />
        <Row label="Capital Goods ITC" value={data.itcCapital} indent />
      </Section>

      <Section number="4B" title="Blocked ITC (Cannot Claim)">
        <Row label="Blocked ITC (food, vehicles, personal)" value={data.itcBlocked} />
      </Section>

      <Section number="5" title="Exempt / Nil-rated Turnover">
        <Row label="Total exempt / out-of-scope transactions" value={data.exemptTurnover} />
      </Section>

      <Section number="6.1" title="Net GST Payable">
        <Row label="Output tax − Eligible ITC" value={data.netGstPayable} />
      </Section>

      <p className="text-xs text-muted-foreground">
        ⚠ This is a pre-fill estimate based on transaction descriptions. Always verify with your CA before filing.
      </p>
    </div>
  );
}
