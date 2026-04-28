/**
 * @file page.tsx — /reconciliation — marketplace settlement reconciliation hero page.
 * @module app/(app)/reconciliation
 *
 * RSC: fetches all settlements + reconciliations for the business in parallel.
 * Groups reconciliation rows by settlement_id and passes them as props to the
 * client SettlementCard components. Headline summarises the total amount owed
 * across all open discrepancies.
 *
 * @related components/reconciliation/SettlementCard.tsx, lib/reconciliation
 */

import { desc, eq } from "drizzle-orm";
import { ShoppingBag, Upload, History, ReceiptText, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  SettlementCard,
  type ReconciliationRow,
  type SettlementData,
} from "@/components/reconciliation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { db } from "@/db/client";
import { reconciliations, settlements } from "@/db/schema";
import { getCurrentBusiness } from "@/lib/auth";
import { formatINR } from "@/lib/utils";

export default async function ReconciliationPage() {
  const result = await getCurrentBusiness();
  if (!result) redirect("/auth/login");
  if (!result.business) redirect("/onboarding");

  const businessId = result.business.id;

  const [allSettlements, allReconciliations] = await Promise.all([
    db
      .select()
      .from(settlements)
      .where(eq(settlements.business_id, businessId))
      .orderBy(desc(settlements.uploaded_at)),
    db
      .select()
      .from(reconciliations)
      .where(eq(reconciliations.business_id, businessId))
      .orderBy(desc(reconciliations.detected_at)),
  ]);

  // Group reconciliations by settlement_id.
  const reconBySettlement = new Map<string, ReconciliationRow[]>();
  for (const r of allReconciliations) {
    const key = r.settlement_id;
    if (!reconBySettlement.has(key)) reconBySettlement.set(key, []);
    reconBySettlement.get(key)!.push(r as ReconciliationRow);
  }

  const totalOwed = allReconciliations
    .filter((r) => r.status === "pending" || r.status === "disputed")
    .reduce((s, r) => s + Math.abs(Number(r.discrepancy ?? 0)), 0);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Reconciliation</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Compare Amazon settlement payouts against your actual bank credits.
          </p>
        </div>
        <Button asChild className="px-6 h-12 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-black text-xs uppercase tracking-widest shadow-sm transition-all">
          <Link href="/upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload settlement
          </Link>
        </Button>
      </div>

      {allSettlements.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No settlements uploaded yet"
          description="Upload an Amazon settlement report to see reconciliation."
        >
          <Button asChild className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-600/20">
            <Link href="/upload">Upload settlement CSV</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {totalOwed > 10 && (
            <div className="rounded-[40px] border border-rose-100 bg-rose-50/20 p-8 flex flex-col lg:flex-row items-center gap-12 shadow-sm relative overflow-hidden">
              {/* Left Side: Summary */}
              <div className="flex items-center gap-6 shrink-0">
                <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-sm border border-rose-100">
                  <div className="text-4xl font-black text-[#FF9900]">a</div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Amazon owes you</span>
                  <span className="text-4xl font-black text-rose-600 tracking-tighter mt-1">{formatINR(totalOwed.toFixed(2))}</span>
                  <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Across 1 open discrepancy</span>
                </div>
              </div>

              {/* Right Side: Steps */}
              <div className="flex-1 flex items-center justify-between gap-8 py-4 px-10 border-l border-rose-100/50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <History className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 dark:text-white">Raise Disputes</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Identify & raise disputes</span>
                  </div>
                </div>

                <div className="text-slate-200">
                   <ArrowRight className="h-4 w-4" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 dark:text-white">Payments</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Track incoming payments</span>
                  </div>
                </div>

                <div className="text-slate-200">
                   <ArrowRight className="h-4 w-4" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 dark:text-white">Manage Reimbursements</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Get reimbursed faster</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {(allSettlements as SettlementData[]).map((s) => (
              <SettlementCard
                key={s.id}
                settlement={s}
                reconciliations={reconBySettlement.get(s.id) ?? []}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

