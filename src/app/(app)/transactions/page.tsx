/**
 * @file page.tsx — /transactions — list + filter + edit + delete transactions.
 * @module app/(app)/transactions
 *
 * RSC: fetches the static gst_categories list once on the server (37 rows),
 * passes it as a prop into the client TransactionTable for the edit modal's
 * category dropdown. The table itself fetches transactions client-side via
 * useTransactions so filter changes (URL searchParams) re-fetch instantly
 * without a navigation.
 *
 * @related components/transactions/TransactionTable.tsx, lib/hooks/useTransactions.ts
 */

import { asc } from "drizzle-orm";

import { TransactionTable } from "@/components/transactions";
import { db } from "@/db/client";
import { gst_categories, transactions } from "@/db/schema";
import { getCurrentBusiness } from "@/lib/auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatINR } from "@/lib/utils";

export default async function TransactionsPage() {
  const result = await getCurrentBusiness();
  if (!result) redirect("/auth/login");
  if (!result.business) redirect("/onboarding");

  const businessId = result.business.id;

  const [categoryRows, stats] = await Promise.all([
    db
      .select({
        category: gst_categories.category,
        gst_section: gst_categories.gst_section,
      })
      .from(gst_categories)
      .orderBy(asc(gst_categories.category)),
    db
      .select({
        count: sql<number>`count(*)`,
        credits: sql<string>`COALESCE(SUM(${transactions.credit_amount}), '0')`,
        debits: sql<string>`COALESCE(SUM(${transactions.debit_amount}), '0')`,
      })
      .from(transactions)
      .where(eq(transactions.business_id, businessId))
  ]);

  const { count, credits, debits } = stats[0];
  const balance = parseFloat(credits) - parseFloat(debits);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Transactions</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Every line item from your uploaded statements, AI-categorised.
          Use &ldquo;Needs review&rdquo; to focus on low-confidence rows.
        </p>
      </div>
      <TransactionTable categories={categoryRows} />
    </div>
  );
}

