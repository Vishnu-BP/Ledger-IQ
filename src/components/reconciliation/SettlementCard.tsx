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
import { 
  CheckCircle, 
  ExternalLink, 
  FileText, 
  Info, 
  Copy, 
  CheckCircle2, 
  History, 
  ReceiptText, 
  ArrowRight 
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate, cn } from "@/lib/utils";

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
    <div className="bg-white dark:bg-zinc-950 rounded-[40px] border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="p-8 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Settlement {settlement.settlement_id_external}
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {settlement.period_start && settlement.period_end
                  ? `${formatDate(settlement.period_start)} – ${formatDate(settlement.period_end)}`
                  : "Period unknown"}
                <span className="mx-2 opacity-50">·</span>
                Deposited {settlement.deposit_date ? formatDate(settlement.deposit_date) : "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {settlement.total_amount && (
              <span className="text-sm font-black text-slate-500 tabular-nums">
                Amazon stated: <span className="text-slate-900 dark:text-white">₹{Number(settlement.total_amount).toLocaleString()}</span>
              </span>
            )}
            <div className="px-4 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100/50">
              RECONCILED
            </div>
          </div>
        </div>

        {totalDiscrepancy > 10 && rows.length > 0 && (
          <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/20 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center">
                <Info className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs font-black text-rose-500 uppercase tracking-tight">
                Amazon owes you {formatINR(totalDiscrepancy.toFixed(2))} across {orderIds.length} disputed order{orderIds.length === 1 ? "" : "s"}
              </p>
            </div>
            <button className="text-[11px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 hover:underline">
              View discrepancy <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="p-8 pt-4 space-y-8">
          {rows.map((r) => (
            <div key={r.id} className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    PAYOUT MISMATCH
                  </span>
                  <div className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {formatINR(Math.abs(Number(r.discrepancy ?? 0)).toFixed(2))} GAP
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    r.status === "pending" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  )}>
                    {r.status}
                  </div>
                </div>
                <div className="flex gap-3">
                  {r.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        className="h-10 px-6 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-black uppercase tracking-widest shadow-sm transition-all"
                        onClick={() => updateStatus(r.id, "disputed")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Raise Dispute
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 px-6 rounded-2xl border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-widest shadow-sm transition-all"
                        onClick={() => updateStatus(r.id, "resolved")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Resolve
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-3 gap-8 p-1">
                <div className="flex flex-col gap-1.5">
                   <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">EXPECTED (Amazon)</span>
                   <span className="text-2xl font-black text-indigo-600 tabular-nums tracking-tighter">₹{Number(r.expected_amount).toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                   <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">RECEIVED (Bank)</span>
                   <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">₹{Number(r.actual_amount).toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                   <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">DIFFERENCE</span>
                   <span className="text-2xl font-black text-rose-500 tabular-nums tracking-tighter">₹{Number(r.discrepancy).toLocaleString()}</span>
                </div>
              </div>

              {/* Detail Info Box */}
              <div className="bg-indigo-50/30 dark:bg-zinc-900/50 rounded-3xl p-8 flex gap-6 border border-indigo-100/50">
                <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
                  <Info className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-4">
                  {r.ai_explanation && (
                    <p className="text-[13px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      {r.ai_explanation}
                    </p>
                  )}
                  {Array.isArray(r.affected_order_ids) && r.affected_order_ids.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-indigo-100/30">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Order ID:</span>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{(r.affected_order_ids as string[]).join(", ")}</span>
                      <button className="text-slate-400 hover:text-slate-600 transition-colors ml-1"><Copy className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

