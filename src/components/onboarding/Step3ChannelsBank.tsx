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
        <Label className="text-slate-600 dark:text-slate-400">Where do you sell? *</Label>
        <div className="grid grid-cols-2 gap-3">
          {SALES_CHANNELS.map((ch) => {
            const isActive = channels.includes(ch.value);
            return (
              <button
                key={ch.value}
                type="button"
                onClick={() => toggleChannel(ch.value)}
                className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all hover:border-brand-indigo/50 ${
                  isActive
                    ? "border-brand-indigo bg-indigo-50 dark:bg-indigo-950/30"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                }`}
              >
                <span className="text-lg">{ch.icon}</span>
                <span className={`text-sm font-medium ${isActive ? "text-brand-indigo" : "text-slate-900 dark:text-slate-50"}`}>
                  {ch.label}
                </span>
                <span className="text-[10px] leading-tight text-slate-500">
                  {ch.description}
                </span>
              </button>
            );
          })}
        </div>
        {form.formState.errors.sales_channels && (
          <p className="text-xs text-destructive font-medium">
            {form.formState.errors.sales_channels.message}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-slate-600 dark:text-slate-400">Primary bank *</Label>
        <div className="grid grid-cols-2 gap-3">
          {BANKS.map((b) => {
            const isActive = bank === b.value;
            return (
              <button
                key={b.value}
                type="button"
                onClick={() =>
                  form.setValue("primary_bank", b.value, { shouldValidate: true })
                }
                className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all hover:border-brand-indigo/50 ${
                  isActive
                    ? "border-brand-indigo bg-indigo-50 dark:bg-indigo-950/30"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                }`}
              >
                <span className="text-lg">{b.icon}</span>
                <span className={`text-sm font-medium ${isActive ? "text-brand-indigo" : "text-slate-900 dark:text-slate-50"}`}>
                  {b.label}
                </span>
                <span className="text-[10px] leading-tight text-slate-500">
                  {b.description}
                </span>
              </button>
            );
          })}
        </div>
        {form.formState.errors.primary_bank && (
          <p className="text-xs text-destructive font-medium">
            {form.formState.errors.primary_bank.message}
          </p>
        )}
      </div>
    </div>
  );
}
