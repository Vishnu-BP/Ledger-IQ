"use client";

/**
 * @file PdfExportButton.tsx — Client wrapper that lazy-loads the PDF download component.
 * @module components/reports
 *
 * Wraps `PdfDownloadInner` with next/dynamic + ssr:false. Doing it at the
 * component level (not at the import level) means @react-pdf/renderer is
 * only loaded into the client bundle, never the server. This is the
 * supported Next.js 14 pattern for browser-only ESM packages with
 * render-prop children.
 *
 * @dependencies next/dynamic
 * @related PdfDownloadInner.tsx, PdfReport.tsx
 */

import dynamic from "next/dynamic";
import { FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReportData } from "@/lib/reports";

const PdfDownloadInner = dynamic(() => import("./PdfDownloadInner"), {
  ssr: false,
  loading: () => (
    <Button disabled size="sm">
      <FileDown className="mr-2 h-4 w-4" />
      Loading…
    </Button>
  ),
});

export function PdfExportButton({ data }: { data: ReportData }) {
  return <PdfDownloadInner data={data} />;
}
