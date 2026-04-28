/**
 * @file persist.ts — Atomic bulk-write of categorization results.
 * @module lib/categorization
 *
 * Wraps per-row UPDATEs in a single Drizzle transaction so the table is
 * either fully categorized for this statement or unchanged. ~200 UPDATEs
 * inside one connection finishes well under a second; pre-mature SQL-VALUES
 * optimisation isn't worth the complexity at this scale.
 *
 * @dependencies @/db/client, @/db/schema, drizzle-orm
 * @related categorize.ts, types.ts
 */

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions } from "@/db/schema";
import { createLogger } from "@/lib/logger";

import type { CategorizationResult } from "./types";

const log = createLogger("CATEGORIZE");

export async function bulkUpdateCategorizations(
  results: CategorizationResult[],
): Promise<number> {
  if (results.length === 0) return 0;

  await db.transaction(async (tx) => {
    for (const r of results) {
      await tx
        .update(transactions)
        .set({
          category: r.category,
          channel: r.channel,
          confidence_score: r.confidence.toFixed(3),
          ai_reasoning: r.reasoning,
          model_used: r.modelUsed,
          gst_head: r.gst_head ?? null,
          gst_rate: r.gst_rate ?? null,
          gst_amount: r.gst_amount ?? null,
          tcs_amount: r.tcs_amount ?? null,
        })
        .where(eq(transactions.id, r.txnId));
    }
  });

  log.info("Bulk-updated transactions", { count: results.length });
  return results.length;
}
