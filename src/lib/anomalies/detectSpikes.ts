/**
 * @file detectSpikes.ts — Detects unusually large one-off spends by category.
 * @module lib/anomalies
 *
 * Flags any debit transaction in the last 30 days whose amount exceeds 2×
 * the rolling 60-day category average. Only runs for rows that have been
 * AI-categorized (category IS NOT NULL) so the comparison is meaningful.
 *
 * @dependencies @/db/client, drizzle-orm
 */

import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions } from "@/db/schema";

import type { DetectedAnomaly } from "./types";

export async function detectSpikes(
  businessId: string,
): Promise<DetectedAnomaly[]> {
  const rows = await db.execute(sql`
    WITH category_avg AS (
      SELECT
        category,
        AVG(debit_amount::float) AS avg_amount,
        COUNT(*) AS n
      FROM ${transactions}
      WHERE business_id = ${businessId}
        AND debit_amount IS NOT NULL AND debit_amount > 0
        AND category IS NOT NULL
        AND transaction_date::date BETWEEN CURRENT_DATE - INTERVAL '90 days'
                                        AND CURRENT_DATE - INTERVAL '30 days'
      GROUP BY category
      HAVING COUNT(*) >= 3
    )
    SELECT
      t.id,
      t.description,
      t.transaction_date,
      t.debit_amount::float AS amount,
      t.category,
      c.avg_amount
    FROM ${transactions} t
    JOIN category_avg c ON c.category = t.category
    WHERE t.business_id = ${businessId}
      AND t.debit_amount IS NOT NULL
      AND t.debit_amount::float > c.avg_amount * 2
      AND t.transaction_date::date >= CURRENT_DATE - INTERVAL '30 days'
  `);

  return (rows as unknown as Array<{
    id: string;
    description: string;
    transaction_date: string;
    amount: number;
    category: string;
    avg_amount: number;
  }>).map((r) => ({
    type: "spike" as const,
    severity: "medium" as const,
    title: `Spend spike: ${r.description.slice(0, 50)} (${r.category})`,
    transaction_id: r.id,
    metadata: {
      amount: r.amount.toFixed(2),
      category_avg: r.avg_amount.toFixed(2),
      multiplier: (r.amount / r.avg_amount).toFixed(1),
      category: r.category,
      date: r.transaction_date,
    },
  }));
}
