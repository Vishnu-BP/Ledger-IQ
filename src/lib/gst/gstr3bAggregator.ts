/**
 * @file gstr3bAggregator.ts — Aggregate transaction data into GSTR-3B sections.
 * @module lib/gst
 *
 * Computes the five key GSTR-3B sections from categorized transactions:
 *   3.1  Outward supplies (sales) — taxable value + output tax
 *   4A   Eligible ITC — GST paid on goods + services + capital goods
 *   4B   Blocked ITC — GST you cannot claim (food, vehicles, personal)
 *   5    Exempt/nil/out-of-scope turnover
 *   6.1  Net GST payable = output tax − eligible ITC
 *
 * All amounts are strings with 2 dp (postgres-js numeric precision).
 *
 * @dependencies @/db/client, drizzle-orm
 * @related components/reports/Gstr3bView.tsx
 */

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions } from "@/db/schema";

export interface Gstr3bData {
  // 3.1 Outward supplies
  outwardGrossSales: string;
  outwardTaxableValue: string;
  outwardTax: string;

  // 4A Eligible ITC
  itcEligible: string;
  itcGoods: string;
  itcServices: string;
  itcCapital: string;

  // 4B Blocked ITC
  itcBlocked: string;

  // 5 Exempt turnover
  exemptTurnover: string;

  // 6.1 Net payable
  netGstPayable: string;

  // Metadata
  period: string;
  hasData: boolean;
}

export async function getGstr3bData(businessId: string): Promise<Gstr3bData> {
  const [outward, itcGoods, itcServices, itcCapital, blocked, exempt] =
    await Promise.all([
      // 3.1 Outward Supplies
      db
        .select({
          gross: sql<string>`COALESCE(SUM(${transactions.credit_amount}), 0::numeric)`,
          tax: sql<string>`COALESCE(SUM(${transactions.gst_amount}), 0::numeric)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.business_id, businessId),
            eq(transactions.gst_head, "Outward Supplies"),
          ),
        ),

      // 4A ITC — Goods
      db
        .select({
          tax: sql<string>`COALESCE(SUM(${transactions.gst_amount}), 0::numeric)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.business_id, businessId),
            eq(transactions.gst_head, "ITC - Goods"),
          ),
        ),

      // 4A ITC — Services
      db
        .select({
          tax: sql<string>`COALESCE(SUM(${transactions.gst_amount}), 0::numeric)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.business_id, businessId),
            eq(transactions.gst_head, "ITC - Services"),
          ),
        ),

      // 4A ITC — Capital Goods
      db
        .select({
          tax: sql<string>`COALESCE(SUM(${transactions.gst_amount}), 0::numeric)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.business_id, businessId),
            eq(transactions.gst_head, "Capital Goods"),
          ),
        ),

      // 4B Blocked ITC
      db
        .select({
          tax: sql<string>`COALESCE(SUM(${transactions.gst_amount}), 0::numeric)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.business_id, businessId),
            eq(transactions.gst_head, "Blocked ITC"),
          ),
        ),

      // 5 Exempt — sum of both debit + credit for exempt category rows
      db
        .select({
          total: sql<string>`
            COALESCE(SUM(${transactions.debit_amount}), 0::numeric) +
            COALESCE(SUM(${transactions.credit_amount}), 0::numeric)
          `,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.business_id, businessId),
            inArray(transactions.gst_head, ["Exempt"]),
          ),
        ),
    ]);

  const outwardGross = Number(outward[0]?.gross ?? 0);
  const outwardTax = Number(outward[0]?.tax ?? 0);
  const outwardTaxable = outwardGross - outwardTax;

  const itcG = Number(itcGoods[0]?.tax ?? 0);
  const itcS = Number(itcServices[0]?.tax ?? 0);
  const itcC = Number(itcCapital[0]?.tax ?? 0);
  const itcTotal = itcG + itcS + itcC;

  const blockedTotal = Number(blocked[0]?.tax ?? 0);
  const exemptTotal = Number(exempt[0]?.total ?? 0);
  const netPayable = Math.max(0, outwardTax - itcTotal);

  const hasData = outwardGross + itcTotal + exemptTotal > 0;
  const period = new Date().toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return {
    outwardGrossSales: outwardGross.toFixed(2),
    outwardTaxableValue: outwardTaxable.toFixed(2),
    outwardTax: outwardTax.toFixed(2),
    itcEligible: itcTotal.toFixed(2),
    itcGoods: itcG.toFixed(2),
    itcServices: itcS.toFixed(2),
    itcCapital: itcC.toFixed(2),
    itcBlocked: blockedTotal.toFixed(2),
    exemptTurnover: exemptTotal.toFixed(2),
    netGstPayable: netPayable.toFixed(2),
    period,
    hasData,
  };
}
