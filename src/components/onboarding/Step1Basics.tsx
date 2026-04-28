"use client";

/**
 * @file Step1Basics.tsx — Onboarding step 1: business name, type (icon cards), subcategory.
 * @module components/onboarding
 *
 * Business type is now a 2×3 visual icon-card grid instead of a dropdown.
 * Clicking a card sets the react-hook-form field and triggers validation.
 *
 * @related OnboardingWizard.tsx, lib/onboarding/schema.ts, lib/onboarding/constants.ts
 */

import {
  Briefcase,
  Building2,
  Factory,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUSINESS_TYPES } from "@/lib/onboarding/constants";
import type { OnboardingValues } from "@/lib/onboarding/schema";
import { cn } from "@/lib/utils";

// ─── Icon mapping ──────────────────────────────────────────

const TYPE_ICONS: Record<string, LucideIcon> = {
  retail: Store,
  restaurant: UtensilsCrossed,
  service: Briefcase,
  ecommerce: ShoppingBag,
  manufacturing: Factory,
  other: Building2,
};

// ─── Component ─────────────────────────────────────────────

export function Step1Basics({ form }: { form: UseFormReturn<OnboardingValues> }) {
  const selected = form.watch("business_type");

  function selectType(value: OnboardingValues["business_type"]) {
    form.setValue("business_type", value, { shouldValidate: true });
  }

  return (
    <div className="space-y-5">
      {/* Business name */}
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-sm font-medium">
          Business name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="e.g. Sharma Electronics"
          className="h-10"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Business type — icon card grid */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Business type <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {BUSINESS_TYPES.map((type) => {
            const Icon = TYPE_ICONS[type.value] ?? Building2;
            const isSelected = selected === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => selectType(type.value as OnboardingValues["business_type"])}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3.5 text-center transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-xs font-medium leading-none", isSelected ? "text-primary" : "text-foreground")}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
        {form.formState.errors.business_type && (
          <p className="text-xs text-destructive">{form.formState.errors.business_type.message}</p>
        )}
      </div>

      {/* Industry subcategory */}
      <div className="space-y-1.5">
        <Label htmlFor="industry_subcategory" className="text-sm font-medium">
          Industry subcategory{" "}
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="industry_subcategory"
          placeholder="e.g. Electronics, Fashion, Tutoring"
          className="h-10"
          {...form.register("industry_subcategory")}
        />
        <p className="text-xs text-muted-foreground">
          Helps AI pick more accurate categories for your transactions.
        </p>
      </div>
    </div>
  );
}
