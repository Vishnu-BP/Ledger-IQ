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
        <Label htmlFor="name">Business name *</Label>
        <Input
          id="name"
          placeholder="My Awesome Shop"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Business type *</Label>
        <Select
          value={businessType || undefined}
          onValueChange={(v) =>
            form.setValue(
              "business_type",
              v as OnboardingValues["business_type"],
              { shouldValidate: true },
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pick a type" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.business_type && (
          <p className="text-sm text-destructive">
            {form.formState.errors.business_type.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry_subcategory">
          Industry subcategory{" "}
          <span className="text-muted-foreground">(optional)</span>
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
