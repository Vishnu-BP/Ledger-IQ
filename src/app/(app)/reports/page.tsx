/**
 * @file page.tsx — /reports — GSTR-3B, PDF, Excel export hub.
 * @module app/(app)/reports
 *
 * RSC: fetches all report data in parallel via buildReportData, then passes
 * serialized data to client tab components. Three tabs:
 *   - GSTR-3B  — pre-filled values with copy buttons for GST portal
 *   - PDF      — click to generate + download audit-ready PDF
 *   - Excel    — 3-sheet workbook download
 */

import { eq } from "drizzle-orm";
import { FileText } from "lucide-react";
import { redirect } from "next/navigation";

import {
  ExcelExportButton,
  Gstr3bView,
  PdfExportButton,
} from "@/components/reports";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { db } from "@/db/client";
import { statements } from "@/db/schema";
import { getCurrentBusiness } from "@/lib/auth";
import { buildReportData } from "@/lib/reports";

export default async function ReportsPage() {
  const result = await getCurrentBusiness();
  if (!result) redirect("/auth/login");
  if (!result.business) redirect("/onboarding");

  const businessId = result.business.id;
  const statementCount = await db.$count(
    statements,
    eq(statements.business_id, businessId),
  );

  if (statementCount === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={FileText}
          title="Reports unlock with categorized data"
          description="Upload a bank statement and let AI categorize it — GSTR-3B, PDF, and Excel reports will appear here."
        />
      </div>
    );
  }

  const reportData = await buildReportData(businessId, result.business.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Header />
        <div className="flex gap-2">
          <PdfExportButton data={reportData} />
          <ExcelExportButton data={reportData} />
        </div>
      </div>

      <Tabs defaultValue="gstr3b">
        <TabsList>
          <TabsTrigger value="gstr3b">GSTR-3B</TabsTrigger>
          <TabsTrigger value="pdf">PDF Report</TabsTrigger>
          <TabsTrigger value="excel">Excel Export</TabsTrigger>
        </TabsList>

        <TabsContent value="gstr3b" className="mt-4">
          <Gstr3bView data={reportData.gstr3b} />
        </TabsContent>

        <TabsContent value="pdf" className="mt-4">
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Audit-Ready PDF Report</h3>
            <p className="text-sm text-muted-foreground">
              Financial summary · GSTR-3B overview · top categories · open
              anomalies · transaction appendix.
            </p>
            <PdfExportButton data={reportData} />
          </div>
        </TabsContent>

        <TabsContent value="excel" className="mt-4">
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Multi-sheet Excel Workbook</h3>
            <p className="text-sm text-muted-foreground">
              3 sheets: Transactions (last 50) · Top Categories · GSTR-3B
              Summary. Share with your CA directly.
            </p>
            <ExcelExportButton data={reportData} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
      <p className="text-sm text-muted-foreground">
        GSTR-3B pre-fill · audit-ready PDF · Excel export
      </p>
    </div>
  );
}
