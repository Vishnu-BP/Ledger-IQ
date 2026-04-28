"use client";

/**
 * @file ExcelExportButton.tsx — Downloads a 3-sheet Excel workbook.
 * @module components/reports
 *
 * Sheets: Transactions (last 50) · Top Categories · GSTR-3B Summary.
 * Built client-side via xlsx (SheetJS). All computation is done in the
 * click handler; nothing runs on mount.
 *
 * @dependencies xlsx
 * @related lib/reports/buildReportData.ts
 */

import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import type { ReportData } from "@/lib/reports";

export function ExcelExportButton({ data }: { data: ReportData }) {
  function download() {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Transactions
    const txnRows = [
      ["Date", "Description", "Debit (₹)", "Credit (₹)", "Category"],
      ...data.recentTransactions.map((t) => [
        t.date,
        t.description,
        t.debit ? Number(t.debit) : "",
        t.credit ? Number(t.credit) : "",
        t.category ?? "",
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txnRows), "Transactions");

    // Sheet 2: Top Categories
    const catRows = [
      ["Category", "Total Spend (₹)", "Transaction Count"],
      ...data.topCategories.map((c) => [c.category, c.total, c.count]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catRows), "Categories");

    // Sheet 3: GSTR-3B Summary
    const gstRows = [
      ["GSTR-3B Section", "Amount (₹)"],
      ["3.1 Gross Sales", Number(data.gstr3b.outwardGrossSales)],
      ["3.1 Taxable Value", Number(data.gstr3b.outwardTaxableValue)],
      ["3.1 Output GST", Number(data.gstr3b.outwardTax)],
      ["4A Eligible ITC — Total", Number(data.gstr3b.itcEligible)],
      ["4A ITC on Goods", Number(data.gstr3b.itcGoods)],
      ["4A ITC on Services", Number(data.gstr3b.itcServices)],
      ["4A Capital Goods ITC", Number(data.gstr3b.itcCapital)],
      ["4B Blocked ITC", Number(data.gstr3b.itcBlocked)],
      ["5 Exempt Turnover", Number(data.gstr3b.exemptTurnover)],
      ["6.1 Net GST Payable", Number(data.gstr3b.netGstPayable)],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gstRows), "GSTR-3B");

    const filename = `LedgerIQ-${data.businessName.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  return (
    <Button variant="outline" size="sm" onClick={download}>
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Download Excel
    </Button>
  );
}
