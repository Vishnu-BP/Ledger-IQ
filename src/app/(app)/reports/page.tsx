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
import { FileText, FileDown, Table as TableIcon, LayoutDashboard, ShieldCheck, Download, ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

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
import { Button } from "@/components/ui/button";
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
      <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Header />
        <EmptyState
          icon={FileText}
          title="Reports unlock with categorized data"
          description="Upload a bank statement and let AI categorize it — GSTR-3B, PDF, and Excel reports will appear here."
        >
          <Button asChild className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-600/20">
            <Link href="/upload">Upload statement CSV</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const reportData = await buildReportData(businessId, result.business.name);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <Header />
        <div className="flex items-center gap-3">
          <PdfExportButton data={reportData} />
          <ExcelExportButton data={reportData} />
        </div>
      </div>

      <Tabs defaultValue="gstr3b" className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-1">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            {[
              { id: "gstr3b", label: "GSTR-3B Summary", icon: <TableIcon className="h-4 w-4" /> },
              { id: "pdf", label: "PDF Audit Report", icon: <FileText className="h-4 w-4" /> },
              { id: "excel", label: "Excel Data Export", icon: <Download className="h-4 w-4" /> },
            ].map((t) => (
              <TabsTrigger 
                key={t.id}
                value={t.id} 
                className="bg-transparent border-none px-0 py-4 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none relative group"
              >
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 data-[state=active]:text-indigo-600 transition-colors">
                  {t.icon}
                  {t.label}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300" />
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="gstr3b" className="mt-0 focus-visible:outline-none">
          <Gstr3bView data={reportData.gstr3b} />
        </TabsContent>

        <TabsContent value="pdf" className="mt-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-zinc-950 rounded-[40px] border border-slate-100 dark:border-zinc-800 p-10 shadow-sm space-y-8">
              <div className="h-16 w-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm">
                <FileText className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Audit-Ready PDF Report</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  A comprehensive financial dossier including summary analytics, GSTR-3B breakdowns, top expense categories, and a full transaction appendix.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-6">
                <PdfExportButton data={reportData} />
                <button className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors flex items-center gap-2">
                  Preview Report <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-indigo-50/20 dark:bg-zinc-900/30 rounded-[40px] border border-indigo-100/30 p-10 flex flex-col justify-center gap-6">
               <div className="flex items-center gap-3 text-indigo-600">
                  <ShieldCheck className="h-6 w-6" />
                  <span className="text-sm font-black uppercase tracking-widest">Compliance Guaranteed</span>
               </div>
               <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                 All LedgerIQ reports are structured to meet standard Indian accounting and GST audit requirements. Your data is processed securely and remains private.
               </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="excel" className="mt-0 focus-visible:outline-none">
          <div className="bg-white dark:bg-zinc-950 rounded-[40px] border border-slate-100 dark:border-zinc-800 p-10 shadow-sm max-w-4xl">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="space-y-6">
                   <div className="h-16 w-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                      <LayoutDashboard className="h-8 w-8" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Excel Data Workbook</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md">
                        Download a multi-sheet workbook containing raw transactions, category splits, and GST summaries. Perfect for your CA.
                      </p>
                   </div>
                   <div className="flex items-center gap-4">
                      {["Transactions", "Categories", "GST Summary"].map(f => (
                        <div key={f} className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">{f}</div>
                      ))}
                   </div>
                </div>
                <div className="shrink-0">
                   <ExcelExportButton data={reportData} />
                </div>
             </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Header() {
  return (
    <div className="space-y-1">
      <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Reports</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
        GSTR-3B pre-fill · Audit-ready PDF · Excel workbook exports
      </p>
    </div>
  );
}

