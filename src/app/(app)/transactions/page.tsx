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
import { gst_categories } from "@/db/schema";

export default async function TransactionsPage() {
  const categoryRows = await db
    .select({
      category: gst_categories.category,
      gst_section: gst_categories.gst_section,
    })
    .from(gst_categories)
    .orderBy(asc(gst_categories.category));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Every line item from your bank statements. AI categorisation arrives
          in Layer 3 — for now you can review, filter, edit, and delete.
        </p>
      </div>

      <TransactionTable categories={categoryRows} />
    </div>
  );
}
