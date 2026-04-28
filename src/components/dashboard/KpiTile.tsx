/**
 * @file KpiTile.tsx — Single KPI card for the dashboard header row.
 * @module components/dashboard
 *
 * RSC-compatible (no hooks). Accepts a pre-formatted value string so the
 * parent RSC can do formatting (formatINR, etc.) server-side.
 *
 * @related app/(app)/dashboard/page.tsx
 */

import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiTileProps {
  label: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
  iconClassName?: string;
  valueClassName?: string;
}

export function KpiTile({
  label,
  value,
  subtext,
  icon: Icon,
  iconClassName,
  valueClassName,
}: KpiTileProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
        {subtext && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}
