/**
 * @file page.tsx — /dashboard — full KPI + chart + anomaly dashboard.
 * @module app/(app)/dashboard
 *
 * Streams three independent sections via Suspense so the page renders
 * progressively: KPI tiles → cash flow chart → channel split + anomalies.
 * All data fetched server-side; client components (charts, panel) receive
 * serialised props so they have no async work of their own.
 *
 * @related lib/analytics/, components/dashboard/, lib/auth/getCurrentBusiness.ts
 */

import { Suspense } from "react";
import { and, desc, eq, sql } from "drizzle-orm";
import { AlertTriangle, ArrowUpRight, CalendarDays, Receipt, Upload } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AnomalyPanel } from "@/components/dashboard/AnomalyPanel";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { ChannelSplitDonut } from "@/components/dashboard/ChannelSplitDonut";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { db } from "@/db/client";
import { anomalies, statements } from "@/db/schema";
import { getCurrentBusiness } from "@/lib/auth";
import { getCashFlow, getChannelSplit, getTotals } from "@/lib/analytics";
import { formatINR } from "@/lib/utils";

// ─── Helpers ───────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Skeleton ──────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl border bg-muted" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-64 animate-pulse rounded-xl border bg-muted" />;
}

function BottomSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="h-64 animate-pulse rounded-xl border bg-muted lg:col-span-2" />
      <div className="h-64 animate-pulse rounded-xl border bg-muted lg:col-span-3" />
    </div>
  );
}

// ─── Async sections ────────────────────────────────────────

async function KpiSection({ businessId }: { businessId: string }) {
  const totals = await getTotals(businessId);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile
        label="Total Revenue"
        value={formatINR(totals.totalRevenue)}
        icon={ArrowUpRight}
        iconClassName="bg-emerald-500/10"
        valueClassName="text-emerald-700 dark:text-emerald-400"
        subtext="All credits to date"
      />
      <KpiTile
        label="GST Liability"
        value={formatINR(totals.gstLiability)}
        icon={Receipt}
        subtext="Output tax on outward supplies"
      />
      <KpiTile
        label="Cash Runway"
        value={totals.cashRunwayDays !== null ? `${totals.cashRunwayDays} days` : "—"}
        icon={CalendarDays}
        subtext="At current avg daily burn"
      />
      <KpiTile
        label="Open Anomalies"
        value={String(totals.openAnomalyCount)}
        icon={AlertTriangle}
        iconClassName={totals.openAnomalyCount > 0 ? "bg-destructive/10" : "bg-emerald-500/10"}
        valueClassName={totals.openAnomalyCount > 0 ? "text-destructive" : "text-emerald-700 dark:text-emerald-400"}
        subtext={totals.openAnomalyCount === 0 ? "Nothing to review" : "Needs your attention"}
      />
    </div>
  );
}

async function CashFlowSection({ businessId }: { businessId: string }) {
  const data = await getCashFlow(businessId, 90);
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Cash Flow</p>
          <p className="text-xs text-muted-foreground">Last 90 days · inflow vs outflow</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />Inflow</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500" />Outflow</span>
        </div>
      </div>
      <CashFlowChart data={data} />
    </div>
  );
}

async function BottomSection({ businessId }: { businessId: string }) {
  const [channels, openAnomalies] = await Promise.all([
    getChannelSplit(businessId),
    db
      .select({
        id: anomalies.id,
        type: anomalies.type,
        severity: anomalies.severity,
        title: anomalies.title,
        ai_explanation: anomalies.ai_explanation,
      })
      .from(anomalies)
      .where(
        and(
          eq(anomalies.business_id, businessId),
          sql`${anomalies.status} NOT IN ('reviewed_ok', 'dismissed')`,
        ),
      )
      .orderBy(desc(anomalies.detected_at))
      .limit(3),
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Channel split donut */}
      <div className="rounded-xl border bg-card p-5 lg:col-span-2">
        <p className="mb-1 text-sm font-semibold">Revenue by Channel</p>
        <p className="mb-4 text-xs text-muted-foreground">Inflow breakdown by source</p>
        <ChannelSplitDonut data={channels} />
      </div>

      {/* Anomaly panel */}
      <div className="rounded-xl border bg-card p-5 lg:col-span-3">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Anomaly Radar</p>
            <p className="text-xs text-muted-foreground">AI-detected issues that need attention</p>
          </div>
          {openAnomalies.length > 0 && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
              {openAnomalies.length} open
            </span>
          )}
        </div>
        <AnomalyPanel anomalies={openAnomalies} />
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────

export default async function DashboardPage() {
  const result = await getCurrentBusiness();
  if (!result) redirect("/auth/login");
  if (!result.business) redirect("/onboarding");

  const { business } = result;
  const statCount = await db.$count(statements, eq(statements.business_id, business.id));

  if (statCount === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <EmptyState
          icon={Upload}
          title="No data yet"
          description="Upload your first bank statement to see KPIs, cash flow charts, and anomaly detection."
        >
          <Button asChild>
            <Link href="/upload">Upload your first statement</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {greeting()}, {business.name}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{todayLabel()}</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/upload" className="flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Upload statement
          </Link>
        </Button>
      </div>

      {/* KPI tiles */}
      <Suspense fallback={<KpiSkeleton />}>
        <KpiSection businessId={business.id} />
      </Suspense>

      {/* Cash flow chart */}
      <Suspense fallback={<ChartSkeleton />}>
        <CashFlowSection businessId={business.id} />
      </Suspense>

      {/* Channel split + anomalies */}
      <Suspense fallback={<BottomSkeleton />}>
        <BottomSection businessId={business.id} />
      </Suspense>
    </div>
  );
}
