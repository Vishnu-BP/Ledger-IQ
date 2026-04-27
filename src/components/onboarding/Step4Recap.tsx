"use client";

/**
 * @file Step4Recap.tsx — Onboarding wizard step 4: review entered values.
 * @module components/onboarding
 *
 * Resolves stored slug values back to display labels (e.g. 'hdfc' → 'HDFC Bank')
 * so the user reviews human-readable text before submitting.
 *
 * @related OnboardingWizard.tsx, lib/onboarding/constants.ts
 */

import {
  BANKS,
  BUSINESS_TYPES,
  FISCAL_YEAR_MONTHS,
  INDIAN_STATES,
  SALES_CHANNELS,
} from "@/lib/onboarding/constants";
import type { OnboardingValues } from "@/lib/onboarding/schema";

function lookup<T extends { value: string | number; label: string }>(
  list: readonly T[],
  value: string | number,
): string {
  return list.find((item) => item.value === value)?.label ?? String(value);
}

export function Step4Recap({ values }: { values: OnboardingValues }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Business name", value: values.name },
    { label: "Type", value: lookup(BUSINESS_TYPES, values.business_type) },
  ];

  if (values.industry_subcategory) {
    rows.push({ label: "Subcategory", value: values.industry_subcategory });
  }
  if (values.gstin) {
    rows.push({ label: "GSTIN", value: values.gstin });
  }
  rows.push({ label: "State", value: lookup(INDIAN_STATES, values.state) });
  rows.push({
    label: "Fiscal year starts",
    value: lookup(FISCAL_YEAR_MONTHS, values.fiscal_year_start_month),
  });
  rows.push({
    label: "Sales channels",
    value: values.sales_channels
      .map((v) => lookup(SALES_CHANNELS, v))
      .join(", "),
  });
  rows.push({ label: "Primary bank", value: lookup(BANKS, values.primary_bank) });

  return (
    <div className="space-y-1 text-sm">
      <p className="pb-2 text-muted-foreground">
        Review your details. You can change any of these later from settings.
      </p>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between gap-4 border-b py-2 last:border-b-0"
        >
          <span className="text-muted-foreground">{row.label}</span>
          <span className="text-right font-medium">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
