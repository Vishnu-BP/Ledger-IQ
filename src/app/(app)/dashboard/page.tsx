/**
 * @file page.tsx — /dashboard — interim Layer-2 summary view.
 * @module app/(app)/dashboard
 *
 * Shell renders immediately; each data section streams in independently via
 * Suspense. Layer 4.1 will replace this with the full KPI/chart/anomaly
 * dashboard once AI categorisation lands.
 *
 * @related lib/auth/getCurrentBusiness.ts, db/schema.ts, components/shell/SignOutButton.tsx
 */

import { Suspense } from "react";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  ReceiptText,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/shell/SignOutButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { db } from "@/db/client";
import { statements, transactions } from "@/db/schema";
import { getCurrentBusiness } from "@/lib/auth";
import { cn, formatDate, formatINR } from "@/lib/utils";

// ─── Skeletons ─────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function RecentTransactionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent transactions</CardTitle>
        <CardDescription>Last 5 rows added across all uploaded statements.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center justify-between gap-4 py-2.5">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ─── Async data components ──────────────────────────────────

async function StatCards({ businessId }: { businessId: string }) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

  const [statementCount, transactionCount, inflowRow, outflowRow] =
    await Promise.all([
      db.$count(statements, eq(statements.business_id, businessId)),
      db.$count(transactions, eq(transactions.business_id, businessId)),
      db
        .select({ total: sql<string>`COALESCE(SUM(${transactions.credit_amount}), '0')` })
        .from(transactions)
        .where(and(eq(transactions.business_id, businessId), gte(transactions.transaction_date, cutoff))),
      db
        .select({ total: sql<string>`COALESCE(SUM(${transactions.debit_amount}), '0')` })
        .from(transactions)
        .where(and(eq(transactions.business_id, businessId), gte(transactions.transaction_date, cutoff))),
    ]);

  if (statementCount === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="No data yet"
        description="Upload your first bank statement to see counts, totals, and recent transactions here."
      >
        <Button asChild>
          <Link href="/upload">Upload your first statement</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Statements" value={statementCount.toString()} icon={<FileText className="h-4 w-4" />} />
      <StatCard label="Transactions" value={transactionCount.toString()} icon={<ReceiptText className="h-4 w-4" />} />
      <StatCard
        label="30-day inflow"
        value={formatINR(inflowRow[0]?.total ?? "0")}
        icon={<ArrowUpRight className="h-4 w-4 text-emerald-600" />}
        valueClassName="text-emerald-700"
      />
      <StatCard
        label="30-day outflow"
        value={formatINR(outflowRow[0]?.total ?? "0")}
        icon={<ArrowDownRight className="h-4 w-4 text-destructive" />}
        valueClassName="text-destructive"
      />
    </div>
  );
}

async function RecentTransactions({ businessId }: { businessId: string }) {
  const recentRows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.business_id, businessId))
    .orderBy(desc(transactions.created_at))
    .limit(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent transactions</CardTitle>
        <CardDescription>Last 5 rows added across all uploaded statements.</CardDescription>
      </CardHeader>
      <CardContent>
        {recentRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Statements uploaded but no transactions parsed. Check the Transactions page.
          </p>
        ) : (
          <ul className="divide-y">
            {recentRows.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="w-24 shrink-0 text-muted-foreground">{formatDate(t.transaction_date)}</span>
                <span className="flex-1 truncate" title={t.description}>{t.description}</span>
                <span className={cn("shrink-0 font-medium", t.credit_amount && "text-emerald-600", t.debit_amount && "text-destructive")}>
                  {t.credit_amount ? `+${formatINR(t.credit_amount)}` : t.debit_amount ? `−${formatINR(t.debit_amount)}` : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ───────────────────────────────────────────────────

export default async function DashboardPage() {
  const result = await getCurrentBusiness();
  if (!result) redirect("/auth/login");
  if (!result.business) redirect("/onboarding");

  const businessId = result.business.id;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {result.business.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what landed in the last 30 days. Full dashboard with
            charts and anomalies arrives in Layer 4.
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
        </div>
      }>
        <StatCards businessId={businessId} />
      </Suspense>

      <Suspense fallback={<RecentTransactionsSkeleton />}>
        <RecentTransactions businessId={businessId} />
      </Suspense>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/upload">Upload another statement</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/transactions">View all transactions</Link>
        </Button>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <p className="text-xs text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">{result.user.email}</span>
          </p>
          <div className="w-40">
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Shared UI ──────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueClassName?: string;
}

function StatCard({ label, value, icon, valueClassName }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
      </CardContent>
    </Card>
  );
}
