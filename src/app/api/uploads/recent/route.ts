/**
 * @file route.ts — GET /api/uploads/recent — recent uploads for the upload page list.
 * @module app/api/uploads/recent
 *
 * Returns the user's most recent statements + settlements unified into a
 * single list for the upload page's "Recent uploads" section. Each item
 * carries the type, filename, status, period, and a count (transactions
 * for statements, settlement lines for settlements).
 *
 * @dependencies @/lib/auth, @/db/client, drizzle-orm
 */

import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";

import { getCurrentBusiness } from "@/lib/auth";
import { db } from "@/db/client";
import { reconciliations, settlement_lines, settlements, statements, transactions } from "@/db/schema";

export interface UploadHistoryItem {
  id: string;
  type: "bank_statement" | "amazon_settlement" | "flipkart_settlement";
  filename: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
  count: number;
  uploaded_at: string;
  // Settlement-only:
  marketplace?: string;
  total_amount?: string | null;
  total_discrepancy?: string;
}

export async function GET() {
  const result = await getCurrentBusiness();
  if (!result) return NextResponse.json({ error: { code: "unauthorized" } }, { status: 401 });
  if (!result.business) return NextResponse.json({ error: { code: "no_business" } }, { status: 403 });

  const businessId = result.business.id;

  const [stmts, setls] = await Promise.all([
    db
      .select({
        id: statements.id,
        filename: statements.filename,
        status: statements.status,
        period_start: statements.period_start,
        period_end: statements.period_end,
        uploaded_at: statements.uploaded_at,
        count: sql<number>`(SELECT COUNT(*)::int FROM ${transactions} WHERE statement_id = ${statements.id})`,
      })
      .from(statements)
      .where(eq(statements.business_id, businessId))
      .orderBy(desc(statements.uploaded_at))
      .limit(20),

    db
      .select({
        id: settlements.id,
        marketplace: settlements.marketplace,
        filename: settlements.filename,
        status: settlements.status,
        period_start: settlements.period_start,
        period_end: settlements.period_end,
        total_amount: settlements.total_amount,
        uploaded_at: settlements.uploaded_at,
        lines_count: sql<number>`(SELECT COUNT(*)::int FROM ${settlement_lines} WHERE settlement_id = ${settlements.id})`,
        total_discrepancy: sql<string>`COALESCE((SELECT SUM(ABS(discrepancy)) FROM ${reconciliations} WHERE settlement_id = ${settlements.id}), 0::numeric)`,
      })
      .from(settlements)
      .where(eq(settlements.business_id, businessId))
      .orderBy(desc(settlements.uploaded_at))
      .limit(20),
  ]);

  const items: UploadHistoryItem[] = [
    ...stmts.map((s) => ({
      id: s.id,
      type: "bank_statement" as const,
      filename: s.filename,
      status: s.status,
      period_start: s.period_start,
      period_end: s.period_end,
      count: s.count,
      uploaded_at: (s.uploaded_at ?? new Date()).toISOString(),
    })),
    ...setls.map((s) => ({
      id: s.id,
      type: (s.marketplace === "flipkart" ? "flipkart_settlement" : "amazon_settlement") as
        | "amazon_settlement"
        | "flipkart_settlement",
      filename: s.filename,
      status: s.status,
      period_start: s.period_start,
      period_end: s.period_end,
      count: s.lines_count,
      uploaded_at: (s.uploaded_at ?? new Date()).toISOString(),
      marketplace: s.marketplace,
      total_amount: s.total_amount,
      total_discrepancy: s.total_discrepancy ?? "0",
    })),
  ].sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));

  return NextResponse.json({ items });
}
