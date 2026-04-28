/**
 * @file detectVendorCreep.ts — Detects vendors whose prices are quietly rising.
 * @module lib/anomalies
 *
 * Compares average debit amount for the same vendor (normalised description)
 * in the last 30 days vs the prior 30–90 day window. Flags vendors where
 * the recent average is >15% higher and there were ≥2 occurrences in each
 * window (enough to be statistically meaningful for small datasets).
 *
 * @dependencies @/db/client, drizzle-orm
 */

import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions } from "@/db/schema";

import type { DetectedAnomaly } from "./types";

const CREEP_THRESHOLD = 0.15; // 15% increase

export async function detectVendorCreep(
  businessId: string,
): Promise<DetectedAnomaly[]> {
  const rows = await db.execute(sql`
    WITH recent AS (
      SELECT
        lower(trim(description)) AS pattern,
        description AS sample_desc,
        AVG(debit_amount::float) AS avg_amount,
        COUNT(*) AS n
      FROM ${transactions}
      WHERE business_id = ${businessId}
        AND debit_amount IS NOT NULL AND debit_amount > 0
        AND transaction_date::date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY lower(trim(description)), description
      HAVING COUNT(*) >= 2
    ),
    prior AS (
      SELECT
        lower(trim(description)) AS pattern,
        AVG(debit_amount::float) AS avg_amount,
        COUNT(*) AS n
      FROM ${transactions}
      WHERE business_id = ${businessId}
        AND debit_amount IS NOT NULL AND debit_amount > 0
        AND transaction_date::date BETWEEN CURRENT_DATE - INTERVAL '90 days'
                                        AND CURRENT_DATE - INTERVAL '30 days'
      GROUP BY lower(trim(description))
      HAVING COUNT(*) >= 2
    )
    SELECT
      r.pattern,
      r.sample_desc,
      r.avg_amount AS recent_avg,
      p.avg_amount AS prior_avg,
      r.n AS recent_count
    FROM recent r
    JOIN prior p ON p.pattern = r.pattern
    WHERE r.avg_amount > p.avg_amount * (1 + ${CREEP_THRESHOLD})
  `);

  return (rows as unknown as Array<{
    pattern: string;
    sample_desc: string;
    recent_avg: number;
    prior_avg: number;
    recent_count: number;
  }>).map((r) => {
    const pct = Math.round(
      ((r.recent_avg - r.prior_avg) / r.prior_avg) * 100,
    );
    return {
      type: "vendor_creep" as const,
      severity: "low" as const,
      title: `Price creep: ${r.sample_desc.slice(0, 50)} (+${pct}%)`,
      transaction_id: null,
      metadata: {
        description_pattern: r.pattern,
        prior_avg: r.prior_avg.toFixed(2),
        recent_avg: r.recent_avg.toFixed(2),
        increase_pct: pct,
      },
    };
  });
}
