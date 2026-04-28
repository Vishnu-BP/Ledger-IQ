/**
 * @file detectDuplicates.ts — Detects probable duplicate transactions.
 * @module lib/anomalies
 *
 * Per PRD §14.4: joins transactions on same debit_amount + same normalised
 * description within 5 days. Uses description (lower+trim) as the
 * counterparty proxy since our parser doesn't extract a structured
 * counterparty_name from bank CSV narratives.
 *
 * Only debit rows are checked (duplicate credits are rare and usually
 * legitimate refunds/settlements).
 *
 * @dependencies @/db/client, drizzle-orm
 */

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions } from "@/db/schema";

import type { DetectedAnomaly } from "./types";

export async function detectDuplicates(
  businessId: string,
): Promise<DetectedAnomaly[]> {
  const rows = await db.execute(sql`
    SELECT
      t2.id          AS suspicious_id,
      t1.id          AS original_id,
      t1.debit_amount,
      t1.description,
      t1.transaction_date AS original_date,
      t2.transaction_date AS suspicious_date
    FROM ${transactions} t1
    JOIN ${transactions} t2
      ON  t1.business_id = t2.business_id
      AND t1.id < t2.id
      AND t1.debit_amount = t2.debit_amount
      AND t1.debit_amount IS NOT NULL
      AND t1.debit_amount > 0
      AND lower(trim(t1.description)) = lower(trim(t2.description))
      AND ABS(
        EXTRACT(EPOCH FROM (
          t2.transaction_date::date - t1.transaction_date::date
        ))
      ) <= 5 * 86400
    WHERE t1.business_id = ${businessId}
  `);

  return (rows as unknown as Array<{
    suspicious_id: string;
    original_id: string;
    debit_amount: string;
    description: string;
    original_date: string;
    suspicious_date: string;
  }>).map((r) => ({
    type: "duplicate" as const,
    severity: "medium" as const,
    title: `Possible duplicate: ${r.description.slice(0, 60)}`,
    transaction_id: r.suspicious_id,
    metadata: {
      original_id: r.original_id,
      suspicious_id: r.suspicious_id,
      amount: r.debit_amount,
      original_date: r.original_date,
      suspicious_date: r.suspicious_date,
    },
  }));
}
