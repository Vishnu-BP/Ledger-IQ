"use client";

/**
 * @file Step1Basics.tsx — Onboarding wizard step 1: business name + type + subcategory.
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
import { BUSINESS_TYPES } from "@/lib/onboarding/constants";
import type { OnboardingValues } from "@/lib/onboarding/schema";

export function Step1Basics({
  form,
}: {
  form: UseFormReturn<OnboardingValues>;
}) {
  const businessType = form.watch("business_type");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-600 dark:text-slate-400">Business name *</Label>
        <Input
          id="name"
          placeholder="My Awesome Shop"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive font-medium">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-slate-600 dark:text-slate-400">Business type *</Label>
        <div className="grid grid-cols-2 gap-3">
          {BUSINESS_TYPES.map((t) => {
            const isActive = businessType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() =>
                  form.setValue("business_type", t.value as any, {
                    shouldValidate: true,
                  })
                }
                className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all hover:border-brand-indigo/50 ${
                  isActive
                    ? "border-brand-indigo bg-indigo-50 dark:bg-indigo-950/30"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span className={`text-sm font-medium ${isActive ? "text-brand-indigo" : "text-slate-900 dark:text-slate-50"}`}>
                  {t.label}
                </span>
                <span className="text-[10px] leading-tight text-slate-500">
                  {t.description}
                </span>
              </button>
            );
          })}
        </div>
        {form.formState.errors.business_type && (
          <p className="text-xs text-destructive font-medium">
            {form.formState.errors.business_type.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry_subcategory" className="text-slate-600 dark:text-slate-400">
          Industry subcategory{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="industry_subcategory"
          placeholder="e.g. Electronics, Fashion, Tutoring"
          {...form.register("industry_subcategory")}
        />
      </div>
    </div>
  );
}
