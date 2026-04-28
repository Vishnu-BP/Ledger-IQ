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
import { ShoppingBag, Upload } from "lucide-react";
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

  // Total open discrepancy across all pending/disputed rows.
  const totalOwed = allReconciliations
    .filter((r) => r.status === "pending" || r.status === "disputed")
    .reduce((s, r) => s + Math.abs(Number(r.discrepancy ?? 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reconciliation</h1>
          <p className="text-sm text-muted-foreground">
            Compare Amazon settlement payouts against your actual bank credits.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/upload">
            <Upload className="mr-2 h-4 w-4" />
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
          <Button asChild>
            <Link href="/upload">Upload settlement CSV</Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          {totalOwed > 10 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-5">
              <p className="text-lg font-bold text-destructive">
                Amazon owes you {formatINR(totalOwed.toFixed(2))}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Across{" "}
                {allReconciliations.filter((r) => r.status === "pending").length}{" "}
                open discrepancies · Raise disputes in Amazon Seller Central → Payments → Manage Reimbursements
              </p>
            </div>
          )}

          <div className="space-y-4">
            {(allSettlements as SettlementData[]).map((s) => (
              <SettlementCard
                key={s.id}
                settlement={s}
                reconciliations={reconBySettlement.get(s.id) ?? []}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
