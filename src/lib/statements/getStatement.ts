/**
 * @file getStatement.ts — Service: read a statement + its categorization progress.
 * @module lib/statements
 *
 * Used by GET /api/statements/:id to drive the polling-based status UX.
 * Returns the statement metadata + a count of transactions that have a
 * non-null category (used by the UI to show "47 of 120 categorized").
 *
 * @dependencies @/db/client, @/db/schema, drizzle-orm
 * @related app/api/statements/[id]/route.ts, lib/hooks/useStatementStatus.ts
 */

import { and, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { statements, transactions } from "@/db/schema";

export interface StatementStatus {
  id: string;
  filename: string;
  status: string;
  total_transactions: number | null;
  categorized_count: number;
  parse_error: string | null;
  completed_at: Date | null;
}

export async function getStatement(
  businessId: string,
  statementId: string,
): Promise<StatementStatus | null> {
  const [row] = await db
    .select({
      id: statements.id,
      filename: statements.filename,
      status: statements.status,
      total_transactions: statements.total_transactions,
      parse_error: statements.parse_error,
      completed_at: statements.completed_at,
    })
    .from(statements)
    .where(
      and(eq(statements.id, statementId), eq(statements.business_id, businessId)),
    )
    .limit(1);

  if (!row) return null;

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(transactions)
    .where(
      and(
        eq(transactions.statement_id, statementId),
        eq(transactions.business_id, businessId),
        isNotNull(transactions.category),
      ),
    );

  return {
    id: row.id,
    filename: row.filename,
    status: row.status,
    total_transactions: row.total_transactions,
    categorized_count: count ?? 0,
    parse_error: row.parse_error,
    completed_at: row.completed_at,
  };
}
