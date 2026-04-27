import "server-only";

/**
 * @file listTransactions.ts — Fetch a paginated, filtered slice of transactions.
 * @module lib/transactions
 *
 * Server-side service used by GET /api/transactions. Always scoped by
 * business_id (auth check happens in the route handler). Filters compose
 * dynamically via Drizzle's `and(...conditions)`.
 *
 * @dependencies @/db/client, drizzle-orm
 * @related app/api/transactions/route.ts
 */

import { and, desc, eq, gte, ilike, lte, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions } from "@/db/schema";

export interface ListTransactionsFilters {
  businessId: string;
  startDate?: string; // ISO YYYY-MM-DD
  endDate?: string;
  search?: string; // matched against description ILIKE
  category?: string;
  channel?: string;
  limit?: number;
  offset?: number;
}

export interface ListTransactionsResult {
  rows: (typeof transactions.$inferSelect)[];
  totalCount: number;
}

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export async function listTransactions(
  filters: ListTransactionsFilters,
): Promise<ListTransactionsResult> {
  const where: SQL[] = [eq(transactions.business_id, filters.businessId)];
  if (filters.startDate) {
    where.push(gte(transactions.transaction_date, filters.startDate));
  }
  if (filters.endDate) {
    where.push(lte(transactions.transaction_date, filters.endDate));
  }
  if (filters.search && filters.search.trim().length > 0) {
    where.push(ilike(transactions.description, `%${filters.search.trim()}%`));
  }
  if (filters.category) {
    where.push(eq(transactions.category, filters.category));
  }
  if (filters.channel) {
    where.push(eq(transactions.channel, filters.channel));
  }

  const limit = Math.min(filters.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Math.max(filters.offset ?? 0, 0);
  const condition = and(...where);

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(condition)
      .orderBy(desc(transactions.transaction_date), desc(transactions.created_at))
      .limit(limit)
      .offset(offset),
    db.$count(transactions, condition),
  ]);

  return { rows, totalCount: totalRows };
}
