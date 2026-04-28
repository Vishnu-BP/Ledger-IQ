"use client";

/**
 * @file PdfExportButton.tsx — Client button that downloads the audit PDF.
 * @module components/reports
 *
 * Uses PDFDownloadLink from @react-pdf/renderer which handles client-side
 * PDF generation and triggers a browser download. The PDF is rendered lazily
 * on first click, not on mount, so there's no SSR issue.
 *
 * @dependencies @react-pdf/renderer
 * @related PdfReport.tsx
 */

import dynamic from "next/dynamic";
import { FileDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReportData } from "@/lib/reports";

// Dynamic import prevents SSR — react-pdf uses browser APIs.
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => null },
);

const PdfReport = dynamic(
  () => import("./PdfReport").then((m) => m.PdfReport),
  { ssr: false, loading: () => null },
);

export function PdfExportButton({ data }: { data: ReportData }) {
  const filename = `LedgerIQ-Report-${data.businessName.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;

  return (
    <PDFDownloadLink
        document={<PdfReport data={data} />}
      fileName={filename}
    >
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
