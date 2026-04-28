/**
 * @file matchSettlements.ts — Match settlement expected payout vs actual bank credits.
 * @module lib/reconciliation
 *
 * Per PRD §14.2:
 *   expected = settlements.total_amount (Amazon's stated disbursement)
 *   actual   = SUM(transactions.credit_amount) WHERE channel=ONLINE_AMAZON
 *              AND transaction_date BETWEEN period_start AND deposit_date + 5 days
 *   discrepancy = expected - actual
 *
 * Returns the match result. The caller (reconcile.ts) decides whether to
 * write a reconciliations row based on whether |discrepancy| > threshold.
 *
 * @dependencies @/db/client, drizzle-orm
 */

import { and, between, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { settlements, transactions } from "@/db/schema";

export interface MatchResult {
  settlement: typeof settlements.$inferSelect;
  expectedAmount: number;
  actualAmount: number;
  discrepancy: number;
  affectedOrderIds: string[];
}

const DISCREPANCY_THRESHOLD = 10; // ignore rounding noise < ₹10

export { DISCREPANCY_THRESHOLD };

export async function matchSettlement(
  businessId: string,
  settlementId: string,
): Promise<MatchResult | null> {
  const [settlement] = await db
    .select()
    .from(settlements)
    .where(
      and(
        eq(settlements.id, settlementId),
        eq(settlements.business_id, businessId),
      ),
    )
    .limit(1);

  if (!settlement) return null;

  const expectedAmount = Number(settlement.total_amount ?? 0);

  // Bank credits attributed to Amazon in the settlement window (±5 days buffer).
  const windowStart = settlement.period_start;
  const windowEnd = settlement.deposit_date ?? settlement.period_end;

  let actualAmount = 0;
  if (windowStart && windowEnd) {
    // Add 5 calendar days to the end date for bank processing delay.
    const endPlusFive = new Date(windowEnd);
    endPlusFive.setDate(endPlusFive.getDate() + 5);
    const windowEndStr = endPlusFive.toISOString().slice(0, 10);

    const [result] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.credit_amount}), '0')`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.business_id, businessId),
          eq(transactions.channel, "ONLINE_AMAZON"),
          isNotNull(transactions.credit_amount),
          between(transactions.transaction_date, windowStart, windowEndStr),
        ),
      );

    actualAmount = Number(result?.total ?? 0);
  }

  const discrepancy = expectedAmount - actualAmount;

  // Collect affected order IDs from settlement lines for context.
  const lineRows = await db.execute(sql`
    SELECT DISTINCT order_id
    FROM settlement_lines
    WHERE settlement_id = ${settlementId}
      AND order_id IS NOT NULL
      AND transaction_type = 'Refund'
    LIMIT 20
  `);

  const affectedOrderIds = (lineRows as unknown as Array<{ order_id: string }>)
    .map((r) => r.order_id)
    .filter(Boolean);

  return { settlement, expectedAmount, actualAmount, discrepancy, affectedOrderIds };
}
