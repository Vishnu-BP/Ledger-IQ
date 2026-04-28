/**
 * @file totals.ts — KPI aggregate queries for the main dashboard tiles.
 * @module lib/analytics
 *
 * All queries are business-scoped and run in parallel via Promise.all in the
 * RSC page. Designed to be fast on a typical SMB dataset (< 10k txns):
 * all use indexed columns (business_id, category, channel).
 *
 * @dependencies @/db/client, drizzle-orm
 * @related app/(app)/dashboard/page.tsx, lib/analytics/cashFlow.ts
 */

import { and, count, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { anomalies, transactions } from "@/db/schema";
import { createLogger } from "@/lib/logger";

const log = createLogger("DB");

export interface DashboardTotals {
  totalRevenue: string;        // sum of all credit_amount
  gstLiability: string;        // sum gst_amount WHERE gst_section='Outward Supplies'
  cashRunwayDays: number | null; // closing_balance / avg_daily_burn, null if can't compute
  openAnomalyCount: number;
}

export async function getTotals(businessId: string): Promise<DashboardTotals> {
  const [revenueRow, gstRow, burnRow, balanceRow, anomalyRow] =
    await Promise.all([
      // Total Revenue — sum of all credits
      db
        .select({
          total: sql<string>`COALESCE(SUM(${transactions.credit_amount}), '0')`,
        })
        .from(transactions)
        .where(eq(transactions.business_id, businessId)),

      // GST Liability — gst_amount on outward supplies rows only
      db
        .select({
          total: sql<string>`COALESCE(SUM(${transactions.gst_amount}), '0')`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.business_id, businessId),
            eq(transactions.gst_head, "Outward Supplies"),
          ),
        ),

      // Avg daily net burn over last 30 days (outflow - inflow)
      db
        .select({
          avg_burn: sql<string>`
            COALESCE(
              (SUM(${transactions.debit_amount}) - SUM(${transactions.credit_amount}))
              / NULLIF(COUNT(DISTINCT ${transactions.transaction_date}), 0),
              '0'
            )`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.business_id, businessId),
            sql`${transactions.transaction_date} >= CURRENT_DATE - INTERVAL '30 days'`,
          ),
        ),

      // Latest closing balance
      db
        .select({ balance: transactions.closing_balance })
        .from(transactions)
        .where(eq(transactions.business_id, businessId))
        .orderBy(
          sql`${transactions.transaction_date} DESC`,
          sql`${transactions.created_at} DESC`,
        )
        .limit(1),

      // Open anomalies
      db
        .select({ cnt: count() })
        .from(anomalies)
        .where(
          and(
            eq(anomalies.business_id, businessId),
            sql`${anomalies.status} NOT IN ('reviewed_ok', 'dismissed')`,
          ),
        ),
    ]);

  const totalRevenue = revenueRow[0]?.total ?? "0";
  const gstLiability = gstRow[0]?.total ?? "0";
  const openAnomalyCount = Number(anomalyRow[0]?.cnt ?? 0);

  const avgBurn = Number(burnRow[0]?.avg_burn ?? 0);
  const latestBalance = Number(balanceRow[0]?.balance ?? 0);
  let cashRunwayDays: number | null = null;
  if (avgBurn > 0 && latestBalance > 0) {
    cashRunwayDays = Math.round(latestBalance / avgBurn);
  }

  log.info("Dashboard totals fetched", {
    business: businessId.slice(0, 8),
    totalRevenue,
    gstLiability,
    openAnomalyCount,
    cashRunwayDays,
  });

  return { totalRevenue, gstLiability, cashRunwayDays, openAnomalyCount };
}
