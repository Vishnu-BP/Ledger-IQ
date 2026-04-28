import { asc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { 
  ReceiptText, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

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
    <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Transactions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          Every line item from your bank statements, AI-categorised. Toggle
          &quot;Needs review&quot; to focus on rows where the model wasn&apos;t sure.
        </p>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Transactions" 
          value={count.toString()} 
          icon={<ReceiptText className="h-6 w-6" />} 
          trend="18.6%"
          trendUp={true}
          color="purple"
        />
        <StatCard 
          label="Total Credits" 
          value={formatINR(credits)} 
          icon={<TrendingUp className="h-6 w-6" />} 
          trend="21.4%"
          trendUp={true}
          color="emerald"
        />
        <StatCard 
          label="Total Debits" 
          value={formatINR(debits)} 
          icon={<TrendingDown className="h-6 w-6" />} 
          trend="12.8%"
          trendUp={false}
          color="rose"
        />
        <StatCard 
          label="Closing Balance" 
          value={formatINR(balance)} 
          icon={<Wallet className="h-6 w-6" />} 
          trend="8.2%"
          trendUp={true}
          color="indigo"
        />
      </div>

      <div className="rounded-[32px] border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 shadow-sm overflow-hidden">
        <TransactionTable categories={categoryRows} />
      </div>
    </div>
  );
}

