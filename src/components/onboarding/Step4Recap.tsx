"use client";

/**
 * @file Step4Recap.tsx — Onboarding step 4: grouped summary before submit.
 * @module components/onboarding
 *
 * Displays entered values in three grouped sections (Business, Tax, Operations)
 * so users can review at a glance before launching. Logic is unchanged from
 * original — same lookup helpers, same data.
 *
 * @related OnboardingWizard.tsx, lib/onboarding/constants.ts
 */

import { Briefcase, Building2, Receipt } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  BANKS,
  BUSINESS_TYPES,
  FISCAL_YEAR_MONTHS,
  INDIAN_STATES,
  SALES_CHANNELS,
} from "@/lib/onboarding/constants";
import type { OnboardingValues } from "@/lib/onboarding/schema";

// ─── Helpers ───────────────────────────────────────────────

function lookup<T extends { value: string | number; label: string }>(
  list: readonly T[],
  value: string | number,
): string {
  return list.find((item) => item.value === value)?.label ?? String(value);
}

// ─── Sub-component ─────────────────────────────────────────

interface ReviewSection {
  icon: LucideIcon;
  label: string;
  rows: Array<{ label: string; value: string }>;
}

function SummaryGroup({ section }: { section: ReviewSection }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
        <section.icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {section.label}
        </span>
      </div>
      <div className="divide-y px-4">
        {section.rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-xs text-muted-foreground">{row.label}</span>
            <span className="text-right text-xs font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────

export function Step4Recap({ values }: { values: OnboardingValues }) {
  const sections: ReviewSection[] = [
    {
      icon: Briefcase,
      label: "Business",
      rows: [
        { label: "Name", value: values.name },
        { label: "Type", value: lookup(BUSINESS_TYPES, values.business_type) },
        ...(values.industry_subcategory
          ? [{ label: "Subcategory", value: values.industry_subcategory }]
          : []),
      ],
    },
    {
      icon: Receipt,
      label: "Tax",
      rows: [
        ...(values.gstin ? [{ label: "GSTIN", value: values.gstin }] : []),
        { label: "State", value: lookup(INDIAN_STATES, values.state) },
        {
          label: "Fiscal year starts",
          value: lookup(FISCAL_YEAR_MONTHS, values.fiscal_year_start_month),
        },
      ],
    },
    {
      icon: Building2,
      label: "Operations",
      rows: [
        {
          label: "Sales channels",
          value: values.sales_channels.map((v) => lookup(SALES_CHANNELS, v)).join(", "),
        },
        { label: "Primary bank", value: lookup(BANKS, values.primary_bank) },
      ],
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        All good? You can change these at any time from Settings after launch.
      </p>
      {sections.map((s) => (
        <SummaryGroup key={s.label} section={s} />
      ))}
    </div>
  );
}
