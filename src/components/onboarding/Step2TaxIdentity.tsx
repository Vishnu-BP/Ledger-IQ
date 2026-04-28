"use client";

/**
 * @file Step2TaxIdentity.tsx — Onboarding step 2: GSTIN, state, fiscal year start month.
 * @module components/onboarding
 *
 * Visual improvements: GSTIN has a mono font + character count hint,
 * state and fiscal-year use improved select styling with descriptive sub-labels.
 *
 * @related OnboardingWizard.tsx, lib/onboarding/schema.ts
 */

import type { UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FISCAL_YEAR_MONTHS, INDIAN_STATES } from "@/lib/onboarding/constants";
import type { OnboardingValues } from "@/lib/onboarding/schema";

// ─── Component ─────────────────────────────────────────────

export function Step2TaxIdentity({ form }: { form: UseFormReturn<OnboardingValues> }) {
  const state = form.watch("state");
  const fiscalMonth = form.watch("fiscal_year_start_month");
  const gstin = form.watch("gstin") ?? "";

  return (
    <div className="space-y-5">
      {/* GSTIN */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="gstin" className="text-sm font-medium">
            GSTIN{" "}
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {gstin.length}/15
          </span>
        </div>
        <Input
          id="gstin"
          placeholder="27AAAAA0000A1Z5"
          maxLength={15}
          autoCapitalize="characters"
          className="h-10 font-mono tracking-wider"
          {...form.register("gstin")}
        />
        {form.formState.errors.gstin ? (
          <p className="text-xs text-destructive">{form.formState.errors.gstin.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Enables GSTR-3B pre-fill and marketplace TCS calculations.
          </p>
        )}
      </div>

      {/* State */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          State / UT <span className="text-destructive">*</span>
        </Label>
        <Select
          value={state || undefined}
          onValueChange={(v) => form.setValue("state", v, { shouldValidate: true })}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select your state" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {INDIAN_STATES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <span className="font-mono text-xs text-muted-foreground mr-2">{s.value}</span>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.state && (
          <p className="text-xs text-destructive">{form.formState.errors.state.message}</p>
        )}
      </div>

      {/* Fiscal year start month */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Fiscal year start month</Label>
        <Select
          value={String(fiscalMonth ?? 4)}
          onValueChange={(v) =>
            form.setValue("fiscal_year_start_month", parseInt(v, 10), { shouldValidate: true })
          }
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FISCAL_YEAR_MONTHS.map((m) => (
              <SelectItem key={m.value} value={String(m.value)}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Most Indian businesses start in April. Change if your books run differently.
        </p>
      </div>
    </div>
  );
}
