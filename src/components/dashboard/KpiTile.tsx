/**
 * @file KpiTile.tsx — Single KPI metric card for the dashboard header row.
 * @module components/dashboard
 *
 * RSC-compatible (no hooks). Icon sits in a soft-colored circle top-right;
 * value is prominent; optional subtext appears below in muted style.
 * Props interface is unchanged from Layer-2 — existing callers work as-is.
 *
 * @related app/(app)/dashboard/page.tsx
 */

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────

interface KpiTileProps {
  label: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
  iconClassName?: string;
  valueClassName?: string;
}

// ─── Component ─────────────────────────────────────────────

export function KpiTile({
  label,
  value,
  subtext,
  icon: Icon,
  iconClassName,
  valueClassName,
}: KpiTileProps) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      {/* Label + icon */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10",
          iconClassName,
        )}>
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Value */}
      <div>
        <p className={cn("text-2xl font-bold tracking-tight", valueClassName)}>
          {value}
        </p>
        {subtext && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>
        )}
      </div>
    </div>
  );
}
