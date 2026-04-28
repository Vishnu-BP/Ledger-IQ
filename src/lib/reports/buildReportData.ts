/**
 * @file buildReportData.ts — Fetches all data needed for PDF + Excel reports.
 * @module lib/reports
 *
 * Single function that runs all analytics queries in parallel. The result is
 * passed to both PdfExportButton and ExcelExportButton as props from the RSC.
 *
 * @dependencies lib/analytics, lib/gst/gstr3bAggregator, @/db/client
 */

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { anomalies, transactions } from "@/db/schema";
import { getCashFlow, getChannelSplit, getTotals } from "@/lib/analytics";
import { getGstr3bData } from "@/lib/gst/gstr3bAggregator";

export interface ReportData {
  businessName: string;
  totals: Awaited<ReturnType<typeof getTotals>>;
  cashFlow: Awaited<ReturnType<typeof getCashFlow>>;
  channelSplit: Awaited<ReturnType<typeof getChannelSplit>>;
  gstr3b: Awaited<ReturnType<typeof getGstr3bData>>;
  topCategories: Array<{ category: string; total: number; count: number }>;
  openAnomalies: Array<{ title: string; ai_explanation: string | null }>;
  recentTransactions: Array<{
    date: string;
    description: string;
    debit: string | null;
    credit: string | null;
    category: string | null;
  }>;
}

export async function buildReportData(
  businessId: string,
  businessName: string,
): Promise<ReportData> {
  const [totals, cashFlow, channelSplit, gstr3b, topCats, openAnoms, recentTxns] =
    await Promise.all([
      getTotals(businessId),
      getCashFlow(businessId, 90),
      getChannelSplit(businessId),
      getGstr3bData(businessId),

      // Top 10 categories by total spend (debit)
      db
        .select({
          category: transactions.category,
          total: sql<string>`SUM(${transactions.debit_amount})`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.business_id, businessId),
            sql`${transactions.category} IS NOT NULL`,
            sql`${transactions.debit_amount} IS NOT NULL`,
          ),
        )
        .groupBy(transactions.category)
        .orderBy(sql`SUM(${transactions.debit_amount}) DESC`)
        .limit(10),

      // Open anomalies
      db
        .select({ title: anomalies.title, ai_explanation: anomalies.ai_explanation })
        .from(anomalies)
        .where(
          and(
            eq(anomalies.business_id, businessId),
            sql`${anomalies.status} NOT IN ('reviewed_ok', 'dismissed')`,
          ),
        )
        .limit(10),

      // Recent 50 transactions for the appendix
      db
        .select({
          date: transactions.transaction_date,
          description: transactions.description,
          debit: transactions.debit_amount,
          credit: transactions.credit_amount,
          category: transactions.category,
        })
        .from(transactions)
        .where(eq(transactions.business_id, businessId))
        .orderBy(desc(transactions.transaction_date), desc(transactions.created_at))
        .limit(50),
    ]);

  return {
    businessName,
    totals,
    cashFlow,
    channelSplit,
    gstr3b,
    topCategories: topCats.map((c) => ({
      category: c.category ?? "Unknown",
      total: Number(c.total ?? 0),
      count: c.count,
    })),
    openAnomalies: openAnoms,
    recentTransactions: recentTxns.map((t) => ({
      date: t.date,
      description: t.description,
      debit: t.debit,
      credit: t.credit,
      category: t.category,
    })),
  };
}
