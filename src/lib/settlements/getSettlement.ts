/**
 * @file getSettlement.ts — Service: read a settlement + its reconciliation progress.
 * @module lib/settlements
 *
 * Mirrors getStatement.ts so the UI polling hook can use a unified shape.
 * Returns the settlement metadata + a count of reconciliations attached
 * (drives the "Reconciling…" UI step).
 *
 * @dependencies @/db/client, @/db/schema, drizzle-orm
 * @related app/api/settlements/[id]/route.ts, lib/hooks/useUploadStatus.ts
 */

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { reconciliations, settlement_lines, settlements } from "@/db/schema";

export interface SettlementStatus {
  id: string;
  filename: string;
  marketplace: string;
  status: string; // 'uploaded' | 'reconciled' | 'error'
  total_amount: string | null;
  deposit_date: string | null;
  period_start: string | null;
  period_end: string | null;
  lines_count: number;
  reconciliation_count: number;
  total_discrepancy: string;
  error: string | null;
  uploaded_at: Date | null;
}

export async function getSettlement(
  businessId: string,
  settlementId: string,
): Promise<SettlementStatus | null> {
  const [row] = await db
    .select()
    .from(settlements)
    .where(
      and(
        eq(settlements.id, settlementId),
        eq(settlements.business_id, businessId),
      ),
    )
    .limit(1);

  if (!row) return null;

  const [linesRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(settlement_lines)
    .where(eq(settlement_lines.settlement_id, settlementId));

  const [reconRow] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
      total: sql<string>`COALESCE(SUM(ABS(${reconciliations.discrepancy})), 0::numeric)`,
    })
    .from(reconciliations)
    .where(eq(reconciliations.settlement_id, settlementId));

  return {
    id: row.id,
    filename: row.filename,
    marketplace: row.marketplace,
    status: row.status,
    total_amount: row.total_amount,
    deposit_date: row.deposit_date,
    period_start: row.period_start,
    period_end: row.period_end,
    lines_count: linesRow?.count ?? 0,
    reconciliation_count: reconRow?.count ?? 0,
    total_discrepancy: reconRow?.total ?? "0",
    error: null,
    uploaded_at: row.uploaded_at,
  };
}
