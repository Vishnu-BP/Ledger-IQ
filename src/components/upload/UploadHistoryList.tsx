"use client";

/**
 * @file UploadHistoryList.tsx — Recent uploads list (statements + settlements).
 * @module components/upload
 *
 * Compact list of past uploads so users always have visibility of work.
 * Each row shows filename, type, status badge, period, count, and a "View"
 * link that routes to the relevant page (transactions for bank, reconciliation
 * for settlements). Empty state shown when there's nothing yet.
 *
 * @related lib/hooks/useUploadHistory.ts, app/(app)/upload/page.tsx
 */

import { FileText, Receipt, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { useUploadHistory, type UploadHistoryItem } from "@/lib/hooks/useUploadHistory";
import { cn, formatDate, formatINR } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, string> = {
  uploaded: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  parsing: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  parsed: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  categorizing: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  complete: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  reconciled: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  error: "bg-destructive/10 text-destructive border-destructive/30",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] uppercase tracking-wide", STATUS_VARIANTS[status])}
    >
      {status}
    </Badge>
  );
}

function TypeIcon({ type }: { type: UploadHistoryItem["type"] }) {
  if (type === "amazon_settlement") return <ShoppingBag className="h-4 w-4 text-orange-600" />;
  if (type === "flipkart_settlement") return <ShoppingBag className="h-4 w-4 text-blue-600" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function rowHref(item: UploadHistoryItem): string {
  if (item.type === "bank_statement") return "/transactions";
  return "/reconciliation";
}

export function UploadHistoryList() {
  const { data, isLoading } = useUploadHistory();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg border bg-muted/30"
          />
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
        <Receipt className="mx-auto mb-2 h-6 w-6 opacity-50" />
        Your uploaded files will appear here.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {items.map((item) => (
        <li key={`${item.type}-${item.id}`}>
          <Link
            href={rowHref(item)}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
          >
            <TypeIcon type={item.type} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="truncate text-sm font-medium" title={item.filename}>
                  {item.filename}
                </p>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {periodLabel(item)}
                {item.count > 0 && (
                  <>
                    {" · "}
                    <span className="font-medium text-foreground">{item.count}</span>{" "}
                    {item.type === "bank_statement" ? "transactions" : "lines"}
                  </>
                )}
                {item.total_amount && Number(item.total_amount) > 0 && (
                  <>
                    {" · "}
                    {formatINR(item.total_amount)}
                  </>
                )}
              </p>
            </div>
            {item.total_discrepancy && Number(item.total_discrepancy) > 10 && (
              <Badge
                variant="outline"
                className="shrink-0 border-destructive/30 bg-destructive/10 text-destructive text-[10px]"
              >
                ₹{Number(item.total_discrepancy).toLocaleString("en-IN")} owed
              </Badge>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function periodLabel(item: UploadHistoryItem): string {
  if (item.period_start && item.period_end) {
    return `${formatDate(item.period_start)} – ${formatDate(item.period_end)}`;
  }
  return new Date(item.uploaded_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
