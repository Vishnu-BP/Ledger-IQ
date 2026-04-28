"use client";

/**
 * @file SettlementCard.tsx — One settlement + its discrepancy records.
 * @module components/reconciliation
 *
 * Shows settlement metadata, expected vs actual amounts, and each
 * reconciliation row with Claude's explanation + status action buttons.
 *
 * @related ReconciliationView.tsx, app/(app)/reconciliation/page.tsx
 */

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatINR, formatDate } from "@/lib/utils";

export interface ReconciliationRow {
  id: string;
  discrepancy_type: string;
  discrepancy: string;
  expected_amount: string;
  actual_amount: string;
  affected_order_ids: unknown;
  ai_explanation: string | null;
  status: string;
}

export interface SettlementData {
  id: string;
  settlement_id_external: string | null;
  marketplace: string;
  period_start: string | null;
  period_end: string | null;
  deposit_date: string | null;
  total_amount: string | null;
  status: string;
}

interface SettlementCardProps {
  settlement: SettlementData;
  reconciliations: ReconciliationRow[];
}

const TYPE_LABELS: Record<string, string> = {
  missing_commission_reversal: "Missing commission reversal",
  fee_mismatch: "Fee discrepancy",
  unprocessed_refund: "Unprocessed refund",
  payout_mismatch: "Payout mismatch",
};

export function SettlementCard({ settlement, reconciliations }: SettlementCardProps) {
  const [rows, setRows] = useState(reconciliations);

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/reconciliation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
      toast.success(status === "disputed" ? "Marked as disputed" : "Marked as resolved");
    } catch {
      toast.error("Could not update status");
    }
  }

  const totalDiscrepancy = rows.reduce(
    (s, r) => s + Math.abs(Number(r.discrepancy ?? 0)),
    0,
  );

  const orderIds = rows
    .flatMap((r) => (Array.isArray(r.affected_order_ids) ? r.affected_order_ids : []))
    .filter(Boolean) as string[];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              Settlement {settlement.settlement_id_external}
            </CardTitle>
            <CardDescription>
              {settlement.period_start && settlement.period_end
                ? `${formatDate(settlement.period_start)} – ${formatDate(settlement.period_end)}`
                : "Period unknown"}
              {settlement.deposit_date &&
                ` · deposited ${formatDate(settlement.deposit_date)}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {settlement.total_amount && (
              <span className="text-sm font-medium text-muted-foreground">
                Amazon stated: {formatINR(settlement.total_amount)}
              </span>
            )}
            <StatusBadge status={settlement.status} />
          </div>
        </div>

        {totalDiscrepancy > 10 && rows.length > 0 && (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm font-semibold text-destructive">
              Amazon owes you {formatINR(totalDiscrepancy.toFixed(2))}
              {orderIds.length > 0 &&
                ` across ${orderIds.length} disputed order${orderIds.length === 1 ? "" : "s"}`}
            </p>
          </div>
        )}

        {rows.length === 0 && (
          <div className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            All settled — no discrepancies found
          </div>
        )}
      </CardHeader>

      {rows.length > 0 && (
        <CardContent className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {TYPE_LABELS[r.discrepancy_type] ?? r.discrepancy_type}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {formatINR(Math.abs(Number(r.discrepancy ?? 0)).toFixed(2))} gap
                  </Badge>
                  <ReconciliationStatusBadge status={r.status} />
                </div>
                <div className="flex gap-2">
                  {r.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => updateStatus(r.id, "disputed")}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Raise dispute
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => updateStatus(r.id, "resolved")}
                      >
                        Resolve
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>Expected: {formatINR(r.expected_amount)}</span>
                <span>Received: {formatINR(r.actual_amount)}</span>
              </div>

              {r.ai_explanation && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {r.ai_explanation}
                </p>
              )}

              {Array.isArray(r.affected_order_ids) && r.affected_order_ids.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Orders: {(r.affected_order_ids as string[]).join(", ")}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    uploaded: "border-blue-200 bg-blue-50 text-blue-700",
    reconciled: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <Badge variant="secondary" className={`text-[10px] uppercase ${map[status] ?? ""}`}>
      {status}
    </Badge>
  );
}

function ReconciliationStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    disputed: "border-blue-200 bg-blue-50 text-blue-700",
    resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <Badge variant="secondary" className={`text-[10px] uppercase ${map[status] ?? ""}`}>
      {status}
    </Badge>
  );
}
