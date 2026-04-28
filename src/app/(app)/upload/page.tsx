"use client";

/**
 * @file page.tsx — /upload — file upload + live status + history list.
 * @module app/(app)/upload
 *
 * Three sections:
 *   1. Upload card — type selector + dropzone (only shown when no file in flight)
 *   2. Status card — live step pills + progress + completion CTA (UploadStatusCard)
 *   3. History list — past uploads with status badges (UploadHistoryList)
 *
 * Uses the unified `useUploadStatus(type, id)` hook that polls either
 * /api/statements/:id (bank) or /api/settlements/:id (marketplace).
 * Fires terminal toasts ONCE per status transition with a "View" action.
 *
 * @related components/upload/*, lib/hooks/{useUpload,useUploadStatus,useUploadHistory}
 */

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  FileDropzone,
  UploadHistoryList,
  UploadStatusCard,
  UploadTypeSelector,
  type UploadType,
} from "@/components/upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUpload, useUploadStatus } from "@/lib/hooks";
import { formatINR } from "@/lib/utils";

export default function UploadPage() {
  const upload = useUpload();
  const queryClient = useQueryClient();
  const [type, setType] = useState<UploadType>("bank_statement");
  const [file, setFile] = useState<File | null>(null);

  // ─── Toasts on upload mutation result ──────────────────
  useEffect(() => {
    if (upload.isSuccess && upload.data) {
      toast.success("Upload received", {
        description:
          upload.data.type === "bank_statement"
            ? `${upload.data.filename} parsed. AI categorising in background…`
            : `${upload.data.filename} stored. Reconciling against bank credits…`,
      });
      // Refresh history so the new upload shows up immediately.
      queryClient.invalidateQueries({ queryKey: ["upload-history"] });
    }
    if (upload.isError && upload.error) {
      toast.error("Upload failed", { description: upload.error.message });
    }
  }, [upload.isSuccess, upload.isError, upload.data, upload.error, queryClient]);

  // ─── Poll status (type-aware) ──────────────────────────
  const status = useUploadStatus(upload.data?.type, upload.data?.id);

  // Refresh history when status flips to terminal so list stays current.
  useEffect(() => {
    if (status.data?.status === "complete" || status.data?.status === "reconciled") {
      queryClient.invalidateQueries({ queryKey: ["upload-history"] });
    }
  }, [status.data?.status, queryClient]);

  // ─── Fire terminal toast once per status transition ────
  const lastStatusRef = useRef<string | null>(null);
  useEffect(() => {
    const data = status.data;
    if (!data) return;
    if (lastStatusRef.current === data.status) return;
    lastStatusRef.current = data.status;

    if (data.type === "bank_statement" && data.status === "complete") {
      toast.success("Categorisation complete", {
        description: `${data.categorized_count ?? 0} of ${data.total_transactions ?? 0} transactions categorised.`,
        action: { label: "View", onClick: () => (window.location.href = "/transactions") },
        duration: 8000,
      });
    } else if (data.type !== "bank_statement" && data.status === "reconciled") {
      const discrepancy = Number(data.total_discrepancy ?? 0);
      const recCount = data.reconciliation_count ?? 0;
      if (discrepancy > 10 && recCount > 0) {
        toast.success(
          `${data.marketplace === "flipkart" ? "Flipkart" : "Amazon"} owes you ${formatINR(discrepancy.toFixed(2))}`,
          {
            description: `${recCount} discrepancies detected across ${data.lines_count ?? 0} settlement lines.`,
            action: { label: "View", onClick: () => (window.location.href = "/reconciliation") },
            duration: 10000,
          },
        );
      } else {
        toast.success("Reconciliation complete", {
          description: `${data.lines_count ?? 0} settlement lines reconciled — no discrepancies.`,
          action: { label: "View", onClick: () => (window.location.href = "/reconciliation") },
          duration: 8000,
        });
      }
    } else if (data.status === "error") {
      toast.error("Processing failed", {
        description: data.parse_error ?? "Unknown error — see server logs.",
        duration: 10000,
      });
    }
  }, [status.data]);

  function handleFile(f: File) {
    setFile(f);
    upload.reset();
    lastStatusRef.current = null;
    upload.mutate({ file: f, type });
  }

  function reset() {
    setFile(null);
    lastStatusRef.current = null;
    upload.reset();
  }

  const showStatusCard = !!file && (upload.isPending || upload.isSuccess || upload.isError);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload</h1>
        <p className="text-sm text-muted-foreground">
          Drop bank statements or marketplace settlement reports. We parse,
          categorise, and reconcile in the background — you can leave this page.
        </p>
      </div>

      {/* ── New upload ──────────────────────────────────── */}
      {!showStatusCard ? (
        <Card>
          <CardHeader>
            <CardTitle>New upload</CardTitle>
            <CardDescription>
              Pick a file type, then drop or browse a CSV.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <UploadTypeSelector value={type} onChange={setType} />
            <FileDropzone onFile={handleFile} />
          </CardContent>
        </Card>
      ) : (
        <>
          <UploadStatusCard
            type={upload.data?.type ?? type}
            filename={file?.name ?? upload.data?.filename ?? ""}
            fileSize={file?.size}
            uploading={upload.isPending}
            status={status.data?.status}
            payload={status.data}
            errorMessage={upload.isError ? upload.error?.message : undefined}
          />
          <Button variant="outline" size="sm" onClick={reset}>
            Upload another file
          </Button>
        </>
      )}

      {/* ── Recent uploads list ─────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent uploads
        </h2>
        <UploadHistoryList />
      </div>
    </div>
  );
}
