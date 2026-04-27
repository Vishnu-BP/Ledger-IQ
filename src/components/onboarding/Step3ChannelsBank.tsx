"use client";

/**
 * @file Step3ChannelsBank.tsx — Onboarding wizard step 3: sales channels + primary bank.
 * @module components/onboarding
 *
 * @related OnboardingWizard.tsx, lib/onboarding/schema.ts
 */

import type { UseFormReturn } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BANKS, SALES_CHANNELS } from "@/lib/onboarding/constants";
import type { OnboardingValues } from "@/lib/onboarding/schema";

export function Step3ChannelsBank({
  form,
}: {
  form: UseFormReturn<OnboardingValues>;
}) {
  const channels = form.watch("sales_channels") ?? [];
  const bank = form.watch("primary_bank");

  function toggleChannel(value: string) {
    const next = channels.includes(value)
      ? channels.filter((c) => c !== value)
      : [...channels, value];
    form.setValue("sales_channels", next, { shouldValidate: true });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Where do you sell? *</Label>
        <div className="grid gap-2">
          {SALES_CHANNELS.map((ch) => (
            <label
              key={ch.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={channels.includes(ch.value)}
                onCheckedChange={() => toggleChannel(ch.value)}
              />
              {ch.label}
            </label>
          ))}
        </div>
        {form.formState.errors.sales_channels && (
          <p className="text-sm text-destructive">
            {form.formState.errors.sales_channels.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Primary bank *</Label>
        <Select
          value={bank || undefined}
          onValueChange={(v) =>
            form.setValue("primary_bank", v, { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pick your main bank" />
          </SelectTrigger>
          <SelectContent>
            {BANKS.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.primary_bank && (
          <p className="text-sm text-destructive">
            {form.formState.errors.primary_bank.message}
          </p>
        )}
      </div>
    </div>
  );
}
