/**
 * @file reconcile.ts — Orchestrator for the settlement reconciliation pipeline.
 * @module lib/reconciliation
 *
 * Per PRD §14.2:
 *   1. Match settlement expected payout vs actual bank credits.
 *   2. If |discrepancy| > ₹10: analyse discrepancy types.
 *   3. Call Claude to explain each discrepancy.
 *   4. Bulk INSERT reconciliations rows.
 *   5. Mark settlement status='reconciled'.
 *
 * Returns the count of reconciliation records inserted.
 *
 * @dependencies @/db/client, @/db/schema, ./matchSettlements, ./analyzeDiscrepancies, ./discrepancyExplainer
 */

import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { reconciliations, settlements } from "@/db/schema";
import { createLogger } from "@/lib/logger";

import { analyzeDiscrepancies } from "./analyzeDiscrepancies";
import { explainDiscrepancy } from "./discrepancyExplainer";
import {
  DISCREPANCY_THRESHOLD,
  matchSettlement,
} from "./matchSettlements";

const log = createLogger("RECONCILE");

export async function reconcile(
  businessId: string,
  settlementId: string,
): Promise<number> {
  const startedAt = Date.now();
  log.info("Reconciliation starting", {
    business: businessId.slice(0, 8),
    settlement: settlementId.slice(0, 8),
  });

  const match = await matchSettlement(businessId, settlementId);
  if (!match) {
    log.warn("Settlement not found", { settlementId: settlementId.slice(0, 8) });
    return 0;
  }

  const { expectedAmount, actualAmount, discrepancy } = match;

  log.info("Match result", {
    expected: expectedAmount.toFixed(2),
    actual: actualAmount.toFixed(2),
    discrepancy: discrepancy.toFixed(2),
  });

  // Mark settlement as reconciled regardless of discrepancy.
  await db
    .update(settlements)
    .set({ status: "reconciled" })
    .where(
      and(
        eq(settlements.id, settlementId),
        eq(settlements.business_id, businessId),
      ),
    );

  if (Math.abs(discrepancy) <= DISCREPANCY_THRESHOLD) {
    log.info("Settlement reconciled — within rounding threshold", {
      settlement: settlementId.slice(0, 8),
    });
    return 0;
  }

  // Analyse what caused the gap.
  const discrepancyRecords = await analyzeDiscrepancies(match);

  // Explain each discrepancy via Claude (sequential to stay under rate limit).
  const inserted: number[] = [];
  for (const record of discrepancyRecords) {
    const explanation = await explainDiscrepancy(record);

    const [row] = await db
      .insert(reconciliations)
      .values({
        business_id: businessId,
        settlement_id: settlementId,
        expected_amount: record.expected_amount,
        actual_amount: record.actual_amount,
        discrepancy: record.discrepancy,
        matched_transaction_ids: [],
        affected_order_ids: record.affected_order_ids,
        discrepancy_type: record.discrepancy_type,
        ai_explanation: explanation,
        status: "pending",
      })
      .returning({ id: reconciliations.id });

    inserted.push(row ? 1 : 0);
  }

  log.info("Reconciliation complete", {
    settlement: settlementId.slice(0, 8),
    discrepancy: discrepancy.toFixed(2),
    records: inserted.length,
    tookMs: Date.now() - startedAt,
  });

  return inserted.length;
}
