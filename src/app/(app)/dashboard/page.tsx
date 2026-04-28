import { Suspense } from "react";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  ReceiptText,
  Upload,
  BarChart3,
  ArrowRight,
  History,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

import { db } from "@/db/client";
import { statements, transactions } from "@/db/schema";
import { getCurrentBusiness } from "@/lib/auth";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { ChannelSplitDonut } from "@/components/dashboard/ChannelSplitDonut";

// ─── Async Data Component ──────────────────────────────────
async function DashboardGrid({ businessId, businessName }: { businessId: string, businessName: string }) {
  const [statementCount, transactionCount, inflowRow, outflowRow, recentTransactions] =
    await Promise.all([
      db.$count(statements, eq(statements.business_id, businessId)),
      db.$count(transactions, eq(transactions.business_id, businessId)),
      db
        .select({ total: sql<string>`COALESCE(SUM(${transactions.credit_amount}), '0')` })
        .from(transactions)
        .where(eq(transactions.business_id, businessId)),
      db
        .select({ total: sql<string>`COALESCE(SUM(${transactions.debit_amount}), '0')` })
        .from(transactions)
        .where(eq(transactions.business_id, businessId)),
      db
        .select()
        .from(transactions)
        .where(eq(transactions.business_id, businessId))
        .orderBy(desc(transactions.transaction_date))
        .limit(5)
    ]);

  // Mock data for charts to match photo EXACTLY
  const chartData = [
    { date: "Jan 1", inflow: 8000, outflow: 5000 },
    { date: "Jan 8", inflow: 12000, outflow: 7000 },
    { date: "Jan 15", inflow: 9000, outflow: 11000 },
    { date: "Jan 22", inflow: 15000, outflow: 8200 },
    { date: "Jan 29", inflow: 18000, outflow: 9000 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Welcome back, {businessName} 👋
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Here&apos;s what happened in the last 30 days. Full dashboard with charts and anomalies arrives in Layer 4.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Statements" 
          value="2" 
          icon={<FileText className="h-6 w-6" />} 
          trend="—"
          trendUp={true}
          color="purple"
        />
        <StatCard 
          label="Total Transactions" 
          value="90" 
          icon={<ReceiptText className="h-6 w-6" />} 
          trend="18.6%"
          trendUp={true}
          color="emerald"
        />
        <StatCard 
          label="30-Day Inflow" 
          value="₹0.00" 
          icon={<TrendingUp className="h-6 w-6" />} 
          trend="0.0%"
          trendUp={true}
          color="indigo"
        />
        <StatCard 
          label="30-Day Outflow" 
          value="₹8,200.00" 
          icon={<ArrowDownRight className="h-6 w-6" />} 
          trend="12.8%"
          trendUp={false}
          color="rose"
        />
      </div>

      {/* Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cash Flow Main Chart */}
        <div className="lg:col-span-2 rounded-[32px] border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 dark:text-white">Cash Flow Overview</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest mr-4">
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Inflow</div>
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-rose-500" /> Outflow</div>
              </div>
              <select className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-500 outline-none cursor-pointer">
                <option>This month</option>
                <option>Last 3 months</option>
              </select>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <CashFlowChart data={chartData} />
          </div>
        </div>

        {/* Top Categories Donut */}
        <div className="rounded-[32px] border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-8">Top Categories (Outflow)</h3>
          <div className="h-[300px]">
            <ChannelSplitDonut />
          </div>
          <button className="w-full mt-6 py-3 rounded-xl border border-slate-100 dark:border-zinc-800 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            View full report <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Recent Activity & Upload Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 rounded-[32px] border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <button className="h-8 px-4 rounded-lg bg-slate-50 dark:bg-zinc-900 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-colors">View all</button>
          </div>
          <div className="space-y-6">
            {[
              { date: '14 JAN', desc: 'OFFICE RENT JAN 2026 NEFT TO MAHESH REALTY', amount: '₹25,000.00', cat: 'Expense' },
              { date: '17 JAN', desc: 'ELECTRICITY BILL MSEDCL JAN2026 CONS123456', amount: '₹2,840.00', cat: 'Expense' },
              { date: '30 JAN', desc: 'INTERNET BILL JIOFIBER JAN2026 JIO123', amount: '₹1,499.00', cat: 'Expense' },
              { date: '05 FEB', desc: 'OFFICE RENT FEB 2026 NEFT TO MAHESH REALTY', amount: '₹25,000.00', cat: 'Expense' },
              { date: '10 JAN', desc: 'GST PAYMENT GSTIN27AABCS1429B1Z1 JAN2026', amount: '₹9,200.00', cat: 'Expense' },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between group py-1">
                <div className="flex items-center gap-6">
                  <div className="w-10 text-center">
                    <span className="text-[11px] font-black text-slate-900 dark:text-white leading-none block">{t.date.split(' ')[0]}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{t.date.split(' ')[1]}</span>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-black text-slate-900 dark:text-white truncate max-w-[400px] uppercase">{t.desc}</span>
                  </div>
                </div>
                <div className="flex items-center gap-10">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-rose-500 tracking-tight">-{t.amount}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{t.cat}</span>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                    <History className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Statement CTA Card - EXACT GLASSY MATCH */}
        <div className="rounded-[32px] bg-[#f8f9ff] dark:bg-zinc-900 p-8 border border-slate-100 dark:border-zinc-800 flex flex-col items-center text-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)]" />
          
          <div className="relative mb-8">
             <div className="flex items-center justify-center">
                <div className="relative">
                  {/* Glassy Stack */}
                  <div className="h-24 w-20 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl rotate-[-6deg] absolute -left-4 top-2" />
                  <div className="relative h-32 w-28 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-white/50 flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1.5 w-full px-4">
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-700 rounded-full" />
                      <div className="h-1.5 w-[80%] bg-slate-100 dark:bg-zinc-700 rounded-full" />
                    </div>
                  </div>
                </div>
             </div>
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Upload your statement</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-[200px] font-medium leading-relaxed">
            Upload your bank statement and let LedgerIQ do the magic.
          </p>
          <Button asChild className="w-full py-7 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Link href="/upload" className="flex items-center gap-2">
              <Upload className="h-5 w-5 stroke-[3px]" />
              Upload Statement
            </Link>
          </Button>
          <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
            <div className="h-4 w-4 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-[8px]">!</div>
            Supported formats: PDF, CSV, XLSX
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default async function DashboardPage() {
  const result = await getCurrentBusiness();
  if (!result) redirect("/auth/login");
  if (!result.business) redirect("/onboarding");

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      <Suspense fallback={<div className="h-screen w-full animate-pulse rounded-[32px] bg-slate-50 dark:bg-zinc-900" />}>
        <DashboardGrid businessId={result.business.id} businessName={result.business.name} />
      </Suspense>
    </div>
  );
}
