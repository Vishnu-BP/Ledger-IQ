"use client";

/**
 * @file PdfDownloadInner.tsx — Inner component that imports @react-pdf/renderer.
 * @module components/reports
 *
 * Isolated into its own file so the parent (PdfExportButton) can load it
 * via next/dynamic with ssr:false. Static imports in this file are then
 * only ever bundled into the client (never SSR'd), avoiding the ESM-only
 * package fail at server-render time.
 *
 * @dependencies @react-pdf/renderer
 * @related PdfExportButton.tsx, PdfReport.tsx
 */

import { PDFDownloadLink } from "@react-pdf/renderer";
import { FileDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReportData } from "@/lib/reports";

import { PdfReport } from "./PdfReport";

export default function PdfDownloadInner({ data }: { data: ReportData }) {
  const filename = `LedgerIQ-Report-${data.businessName.replace(/\s+/g, "-")}-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  return (
    <PDFDownloadLink document={<PdfReport data={data} />} fileName={filename}>
      {({ loading }: { loading: boolean }) => (
        <Button disabled={loading} size="sm">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
