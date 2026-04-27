"use client";

/**
 * @file Step2TaxIdentity.tsx — Onboarding wizard step 2: GSTIN + state + fiscal year.
 * @module components/onboarding
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

export function Step2TaxIdentity({
  form,
}: {
  form: UseFormReturn<OnboardingValues>;
}) {
  const state = form.watch("state");
  const fiscalMonth = form.watch("fiscal_year_start_month");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gstin">
          GSTIN <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="gstin"
          placeholder="e.g. 27AAAAA1234A1Z5"
          autoCapitalize="characters"
          {...form.register("gstin")}
        />
        {form.formState.errors.gstin && (
          <p className="text-sm text-destructive">
            {form.formState.errors.gstin.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>State *</Label>
        <Select
          value={state || undefined}
          onValueChange={(v) =>
            form.setValue("state", v, { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your state" />
          </SelectTrigger>
          <SelectContent>
            {INDIAN_STATES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.state && (
          <p className="text-sm text-destructive">
            {form.formState.errors.state.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Fiscal year start month</Label>
        <Select
          value={String(fiscalMonth ?? 4)}
          onValueChange={(v) =>
            form.setValue("fiscal_year_start_month", parseInt(v, 10), {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
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
      </div>
    </div>
  );
}
