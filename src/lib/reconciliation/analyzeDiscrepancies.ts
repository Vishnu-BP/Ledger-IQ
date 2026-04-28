/**
 * @file analyzeDiscrepancies.ts — Classify what caused the settlement gap.
 * @module lib/reconciliation
 *
 * Takes the raw match result and produces one or more typed discrepancy
 * records. For simplicity at hackathon scale, we classify by pattern:
 *
 *   1. If Refund orders exist without a corresponding commission reversal
 *      line → `missing_commission_reversal`
 *   2. If there's a net fee amount difference → `fee_mismatch`
 *   3. Catch-all → `payout_mismatch`
 *
 * Each record carries enough context for Claude to write a meaningful
 * explanation in discrepancyExplainer.ts.
 *
 * @related matchSettlements.ts, discrepancyExplainer.ts
 */

import { sql } from "drizzle-orm";
import { db } from "@/db/client";

import type { MatchResult } from "./matchSettlements";

export type DiscrepancyType =
  | "missing_commission_reversal"
  | "fee_mismatch"
  | "unprocessed_refund"
  | "payout_mismatch";

export interface DiscrepancyRecord {
  discrepancy_type: DiscrepancyType;
  expected_amount: string;
  actual_amount: string;
  discrepancy: string;
  affected_order_ids: string[];
  settlement_details: Record<string, unknown>;
}

export async function analyzeDiscrepancies(
  match: MatchResult,
): Promise<DiscrepancyRecord[]> {
  const { settlement, expectedAmount, actualAmount, discrepancy, affectedOrderIds } = match;

  // Check for refund orders missing commission reversals.
  const missingReversals = await db.execute(sql`
    SELECT refunds.order_id
    FROM (
      SELECT order_id FROM settlement_lines
      WHERE settlement_id = ${settlement.id}
        AND transaction_type = 'Refund'
        AND amount_type = 'Product Sales'
        AND order_id IS NOT NULL
    ) refunds
    WHERE NOT EXISTS (
      SELECT 1 FROM settlement_lines rev
      WHERE rev.settlement_id = ${settlement.id}
        AND rev.order_id = refunds.order_id
        AND rev.transaction_type = 'Refund'
        AND rev.amount_type IN ('Commission', 'Referral Fee')
    )
  `);

  const missingRevIds = (missingReversals as unknown as Array<{ order_id: string }>)
    .map((r) => r.order_id)
    .filter(Boolean);

  const records: DiscrepancyRecord[] = [];

  const settlementDetails = {
    settlement_id: settlement.settlement_id_external,
    period: `${settlement.period_start} → ${settlement.period_end}`,
    deposit_date: settlement.deposit_date,
    stated_total: expectedAmount.toFixed(2),
    bank_credit: actualAmount.toFixed(2),
  };

  if (missingRevIds.length > 0) {
    records.push({
      discrepancy_type: "missing_commission_reversal",
      expected_amount: expectedAmount.toFixed(2),
      actual_amount: actualAmount.toFixed(2),
      discrepancy: discrepancy.toFixed(2),
      affected_order_ids: missingRevIds,
      settlement_details: {
        ...settlementDetails,
        missing_reversal_orders: missingRevIds,
        note: "These refunded orders show product credit reversed but commission was not refunded by Amazon.",
      },
    });
  } else {
    // Generic payout mismatch.
    records.push({
      discrepancy_type: "payout_mismatch",
      expected_amount: expectedAmount.toFixed(2),
      actual_amount: actualAmount.toFixed(2),
      discrepancy: discrepancy.toFixed(2),
      affected_order_ids: affectedOrderIds.slice(0, 6),
      settlement_details: settlementDetails,
    });
  }

  return records;
}
