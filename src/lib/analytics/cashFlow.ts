/**
 * @file cashFlow.ts — Daily inflow/outflow series for the cash flow chart.
 * @module lib/analytics
 *
 * Per PRD §14.5. Returns one row per calendar day in the window, even for
 * days with no transactions (filled with 0 via a generate_series join so
 * the chart has a continuous X-axis). Limited to last 90 days by default.
 *
 * @dependencies @/db/client, drizzle-orm
 * @related components/dashboard/CashFlowChart.tsx
 */

import { eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions } from "@/db/schema";

export interface CashFlowDay {
  date: string;    // ISO YYYY-MM-DD
  inflow: number;  // sum of credit_amount that day (₹)
  outflow: number; // sum of debit_amount that day (₹)
}

export async function getCashFlow(
  businessId: string,
  daysBack = 90,
): Promise<CashFlowDay[]> {
  // Use a generate_series to guarantee every day appears even with no txns.
  const rows = await db.execute(sql`
    SELECT
      d.day::date::text AS date,
      COALESCE(SUM(t.credit_amount), 0)::float AS inflow,
      COALESCE(SUM(t.debit_amount), 0)::float  AS outflow
    FROM generate_series(
      CURRENT_DATE - ${daysBack} * INTERVAL '1 day',
      CURRENT_DATE,
      INTERVAL '1 day'
    ) AS d(day)
    LEFT JOIN ${transactions} t
      ON t.transaction_date = d.day::date
     AND t.business_id = ${businessId}
    GROUP BY d.day
    ORDER BY d.day ASC
  `);

  return (rows as unknown as Array<{ date: string; inflow: number; outflow: number }>).map(
    (r) => ({
      date: r.date,
      inflow: Number(r.inflow ?? 0),
      outflow: Number(r.outflow ?? 0),
    }),
  );
}
