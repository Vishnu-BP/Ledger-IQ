/**
 * @file applyOverrideToSimilar.ts — Override one row + cascade to exact-match siblings.
 * @module lib/transactions
 *
 * Wraps three operations in a single Drizzle transaction so the user's
 * intent and the cascade are committed atomically:
 *
 *   1. UPDATE the source transaction with the new category/channel/gst_head,
 *      flipping `user_overridden=true` so re-runs of the categorizer skip it.
 *   2. UPSERT a `category_overrides` row keyed on (business_id,
 *      lower(trim(description))) so future uploads with the same vendor
 *      description pick this categorization up via overrideReplay (Stage 3.2).
 *   3. UPDATE every other transaction belonging to this business whose
 *      lower(trim(description)) equals the source row's pattern, applying
 *      the same fields.
 *
 * Returns the count of rows updated by step 3 (the "siblings"), which the
 * UI surfaces in the toast: "Updated and applied to 4 similar transactions".
 *
 * @dependencies @/db/client, @/db/schema, drizzle-orm
 * @related app/api/transactions/[id]/route.ts, lib/categorization/overrideReplay.ts
 */

import { and, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { category_overrides, transactions } from "@/db/schema";
import { createLogger } from "@/lib/logger";

import { TransactionNotFoundError } from "./updateTransaction";

const log = createLogger("CATEGORIZE");

export interface ApplyOverrideToSimilarInput {
  id: string;
  businessId: string;
  category: string;
  channel: string | null;
  gst_head?: string | null;
}

export interface ApplyOverrideToSimilarResult {
  /** The source-row update result (echo of the transaction). */
  source: typeof transactions.$inferSelect;
  /** Number of *other* transactions updated by the cascade. */
  similar_count: number;
  /** ID of the persisted category_overrides row. */
  override_id: string;
}

export async function applyOverrideToSimilar(
  input: ApplyOverrideToSimilarInput,
): Promise<ApplyOverrideToSimilarResult> {
  return await db.transaction(async (tx) => {
    // 1. Update the source row + read back its description so we can build
    //    the exact-match key.
    const [source] = await tx
      .update(transactions)
      .set({
        category: input.category,
        override_category: input.category,
        channel: input.channel,
        override_channel: input.channel,
        gst_head: input.gst_head ?? null,
        user_overridden: true,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(transactions.id, input.id),
          eq(transactions.business_id, input.businessId),
        ),
      )
      .returning();

    if (!source) throw new TransactionNotFoundError();

    const pattern = source.description.trim().toLowerCase();

    // 2. Upsert the override rule. A future re-categorization run replays
    //    this exact-match pattern via `applyOverridesToBatch`.
    const [overrideRow] = await tx
      .insert(category_overrides)
      .values({
        business_id: input.businessId,
        description_pattern: pattern,
        override_category: input.category,
        override_channel: input.channel,
      })
      .onConflictDoUpdate({
        target: [
          category_overrides.business_id,
          category_overrides.description_pattern,
        ],
        set: {
          override_category: input.category,
          override_channel: input.channel,
        },
      })
      .returning({ id: category_overrides.id });

    // 3. Cascade to exact-match siblings (excluding the source row we just
    //    updated). lower(trim(description)) must match the source pattern.
    const siblings = await tx
      .update(transactions)
      .set({
        category: input.category,
        override_category: input.category,
        channel: input.channel,
        override_channel: input.channel,
        gst_head: input.gst_head ?? null,
        user_overridden: true,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(transactions.business_id, input.businessId),
          ne(transactions.id, input.id),
          sql`lower(trim(${transactions.description})) = ${pattern}`,
        ),
      )
      .returning({ id: transactions.id });

    log.info("Applied override to similar", {
      source: input.id.slice(0, 8),
      pattern,
      siblings: siblings.length,
    });

    return {
      source,
      similar_count: siblings.length,
      override_id: overrideRow.id,
    };
  });
}
