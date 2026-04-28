/**
 * @file detectMissingRecurring.ts — Detects expected recurring payments that didn't appear.
 * @module lib/anomalies
 *
 * Per PRD §14.3: identifies vendors that have appeared ≥3 times in the last
 * 90 days with low day-of-month variance (stddev < 5), then checks whether
 * they appeared in the current 30-day window. Missing ones become anomalies.
 *
 * Only debit rows qualify as "recurring" (subscription, rent, salary, etc.).
 *
 * @dependencies @/db/client, drizzle-orm
 */

import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions } from "@/db/schema";

import type { DetectedAnomaly } from "./types";

export async function detectMissingRecurring(
  businessId: string,
): Promise<DetectedAnomaly[]> {
  const rows = await db.execute(sql`
    WITH recurring AS (
      SELECT
        lower(trim(description))       AS pattern,
        description                    AS sample_description,
        AVG(debit_amount::float)       AS expected_amount,
        AVG(EXTRACT(DAY FROM transaction_date::date)) AS expected_day,
        COUNT(*)                       AS occurrences
      FROM ${transactions}
      WHERE business_id = ${businessId}
        AND debit_amount IS NOT NULL AND debit_amount > 0
        AND transaction_date::date >= CURRENT_DATE - INTERVAL '90 days'
        AND transaction_date::date <  CURRENT_DATE - INTERVAL '30 days'
      GROUP BY lower(trim(description)), description
      HAVING COUNT(*) >= 3
         AND STDDEV(EXTRACT(DAY FROM transaction_date::date)) < 5
    ),
    this_month AS (
      SELECT lower(trim(description)) AS pattern
      FROM ${transactions}
      WHERE business_id = ${businessId}
        AND transaction_date::date >= CURRENT_DATE - INTERVAL '30 days'
    )
    SELECT
      r.pattern,
      r.sample_description,
      r.expected_amount,
      r.expected_day,
      r.occurrences
    FROM recurring r
    WHERE NOT EXISTS (
      SELECT 1 FROM this_month m WHERE m.pattern = r.pattern
    )
  `);

  return (rows as unknown as Array<{
    pattern: string;
    sample_description: string;
    expected_amount: number;
    expected_day: number;
    occurrences: number;
  }>).map((r) => ({
    type: "missing_recurring" as const,
    severity: "high" as const,
    title: `Missing recurring: ${r.sample_description.slice(0, 60)}`,
    transaction_id: null,
    metadata: {
      description_pattern: r.pattern,
      expected_amount: r.expected_amount.toFixed(2),
      expected_day: Math.round(r.expected_day),
      historical_occurrences: r.occurrences,
    },
  }));
}
