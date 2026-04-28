/**
 * @file updateTransaction.ts — Patch a transaction row (manual user override).
 * @module lib/transactions
 *
 * Allowed mutable fields: category, channel, gst_head. Setting any of these
 * flips `user_overridden=true` so the AI categorizer doesn't re-clobber the
 * user's choice on a re-run. Ownership enforced via business_id in the WHERE.
 *
 * Server-only by transitive guard (db/client → env.ts), per the same pattern
 * documented in listTransactions.ts.
 *
 * @dependencies @/db/client, drizzle-orm
 * @related app/api/transactions/[id]/route.ts, lib/transactions/index.ts
 */

import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions } from "@/db/schema";

export class TransactionNotFoundError extends Error {
  constructor() {
    super("Transaction not found");
    this.name = "TransactionNotFoundError";
  }
}

export interface UpdateTransactionInput {
  id: string;
  businessId: string;
  category?: string | null;
  channel?: string | null;
  gst_head?: string | null;
}

export async function updateTransaction(input: UpdateTransactionInput) {
  const patch: Partial<typeof transactions.$inferInsert> = {
    updated_at: new Date(),
    user_overridden: true,
  };
  if (input.category !== undefined) {
    patch.category = input.category;
    patch.override_category = input.category;
  }
  if (input.channel !== undefined) {
    patch.channel = input.channel;
    patch.override_channel = input.channel;
  }
  if (input.gst_head !== undefined) {
    patch.gst_head = input.gst_head;
  }

  const [updated] = await db
    .update(transactions)
    .set(patch)
    .where(
      and(
        eq(transactions.id, input.id),
        eq(transactions.business_id, input.businessId),
      ),
    )
    .returning();

  if (!updated) throw new TransactionNotFoundError();
  return updated;
}
