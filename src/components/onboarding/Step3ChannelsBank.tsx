"use client";

/**
 * @file Step3ChannelsBank.tsx — Onboarding step 3: sales channels (tile grid) + primary bank (tile grid).
 * @module components/onboarding
 *
 * Both selections use visual clickable tiles instead of checkboxes/dropdowns.
 * Sales channels support multi-select; bank is single-select.
 *
 * @related OnboardingWizard.tsx, lib/onboarding/schema.ts, lib/onboarding/constants.ts
 */

import {
  Briefcase,
  Gift,
  MoreHorizontal,
  Package,
  ShoppingCart,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { BANKS, SALES_CHANNELS } from "@/lib/onboarding/constants";
import type { OnboardingValues } from "@/lib/onboarding/schema";
import { cn } from "@/lib/utils";

// ─── Icon + colour mapping ──────────────────────────────────

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  physical_store: Store,
  amazon: ShoppingCart,
  flipkart: Package,
  meesho: Gift,
  b2b_direct: Briefcase,
  other: MoreHorizontal,
};

// Accent colour class for bank initial badges
const BANK_COLORS: Record<string, string> = {
  hdfc: "bg-red-500/15 text-red-600 dark:text-red-400",
  icici: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  sbi: "bg-blue-600/15 text-blue-700 dark:text-blue-400",
  axis: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  kotak: "bg-rose-600/15 text-rose-700 dark:text-rose-400",
  other: "bg-muted text-muted-foreground",
};

// ─── Component ─────────────────────────────────────────────

export function Step3ChannelsBank({ form }: { form: UseFormReturn<OnboardingValues> }) {
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
      {/* Sales channels */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Where do you sell? <span className="text-destructive">*</span>
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">(select all that apply)</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {SALES_CHANNELS.map((ch) => {
            const Icon = CHANNEL_ICONS[ch.value] ?? Store;
            const isOn = channels.includes(ch.value);
            return (
              <button
                key={ch.value}
                type="button"
                onClick={() => toggleChannel(ch.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isOn
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                <Icon className={cn("h-4.5 w-4.5", isOn ? "text-primary" : "text-muted-foreground")} style={{ height: "18px", width: "18px" }} />
                <span className={cn("text-xs font-medium leading-none", isOn ? "text-primary" : "text-foreground")}>
                  {ch.label}
                </span>
              </button>
            );
          })}
        </div>
        {form.formState.errors.sales_channels && (
          <p className="text-xs text-destructive">{form.formState.errors.sales_channels.message}</p>
        )}
      </div>

      {/* Primary bank */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Primary bank <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {BANKS.map((b) => {
            const isOn = bank === b.value;
            const initial = b.label.charAt(0).toUpperCase();
            const colorClass = BANK_COLORS[b.value] ?? BANK_COLORS.other;
            return (
              <button
                key={b.value}
                type="button"
                onClick={() => form.setValue("primary_bank", b.value, { shouldValidate: true })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isOn
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", colorClass)}>
                  {initial}
                </div>
                <span className={cn("text-xs font-medium leading-tight", isOn ? "text-primary" : "text-foreground")}>
                  {b.label.replace(" Bank", "").replace(" Mahindra", "")}
                </span>
              </button>
            );
          })}
        </div>
        {form.formState.errors.primary_bank && (
          <p className="text-xs text-destructive">{form.formState.errors.primary_bank.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Determines which CSV column format LedgerIQ parses.
        </p>
      </div>
    </div>
  );
}
