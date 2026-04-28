/**
 * @file channelSplit.ts — Channel breakdown of total inflows for the donut chart.
 * @module lib/analytics
 *
 * Groups credit_amount by channel, computes percentage share. Used by the
 * ChannelSplitDonut component on the dashboard.
 *
 * @dependencies @/db/client, drizzle-orm
 * @related components/dashboard/ChannelSplitDonut.tsx
 */

import { and, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions } from "@/db/schema";
import { getChannelLabel } from "@/lib/transactions/channels";

export interface ChannelSlice {
  channel: string;
  label: string;
  total: number;
  pct: number;
}

export async function getChannelSplit(
  businessId: string,
): Promise<ChannelSlice[]> {
  const rows = await db
    .select({
      channel: transactions.channel,
      total: sql<string>`SUM(${transactions.credit_amount})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.business_id, businessId),
        isNotNull(transactions.channel),
        isNotNull(transactions.credit_amount),
        sql`${transactions.credit_amount} > 0`,
      ),
    )
    .groupBy(transactions.channel)
    .orderBy(sql`SUM(${transactions.credit_amount}) DESC`);

  const grandTotal = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
  if (grandTotal === 0) return [];

  return rows
    .filter((r) => r.channel)
    .map((r) => {
      const total = Number(r.total ?? 0);
      return {
        channel: r.channel!,
        label: getChannelLabel(r.channel),
        total,
        pct: Math.round((total / grandTotal) * 100),
      };
    });
}
