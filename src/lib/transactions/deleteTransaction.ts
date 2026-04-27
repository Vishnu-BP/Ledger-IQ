import "server-only";

/**
 * @file deleteTransaction.ts — Delete a single transaction row owned by the user.
 * @module lib/transactions
 *
 * Ownership scoped via business_id WHERE clause. Returns the deleted row's id
 * so the route can confirm the delete actually hit something (vs. a 404 from
 * a non-existent / wrong-owner id).
 *
 * @dependencies @/db/client, drizzle-orm
 * @related app/api/transactions/[id]/route.ts
 */

import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions } from "@/db/schema";
import { TransactionNotFoundError } from "@/lib/transactions/updateTransaction";

export async function deleteTransaction(args: {
  id: string;
  businessId: string;
}): Promise<{ id: string }> {
  const [deleted] = await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.id, args.id),
        eq(transactions.business_id, args.businessId),
      ),
    )
    .returning({ id: transactions.id });

  if (!deleted) throw new TransactionNotFoundError();
  return deleted;
}
