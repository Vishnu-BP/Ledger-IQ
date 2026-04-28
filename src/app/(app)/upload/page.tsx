"use client";

<<<<<<< HEAD
import Link from "next/link";
=======
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

>>>>>>> 7e2b628697f97fdcdbbc80ff59dd9a8d8e6c31d9
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  FileText, 
  ShoppingBag, 
  MoreVertical, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink,
  Upload
} from "lucide-react";

import {
  FileDropzone,
  UploadHistoryList,
  UploadStatusCard,
  UploadTypeSelector,
  type UploadType,
} from "@/components/upload";
<<<<<<< HEAD
import { useStatementStatus, useUpload } from "@/lib/hooks";

const FAKE_PROGRESS_TARGET = 90;
const FAKE_PROGRESS_INTERVAL_MS = 100;
=======
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
>>>>>>> 7e2b628697f97fdcdbbc80ff59dd9a8d8e6c31d9

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

  const recentUploads = [
    { name: "HDFC_Statement_May_2024.csv", date: "29 May 2024, 10:24 AM", status: "Processed" },
    { name: "Amazon_Settlement_May_2024.csv", date: "28 May 2024, 06:15 PM", status: "Processed" },
    { name: "Flipkart_Settlement_May_2024.csv", date: "27 May 2024, 02:40 PM", status: "Processed" },
    { name: "ICICI_Statement_Apr_2024.csv", date: "25 May 2024, 11:05 AM", status: "Processed" },
    { name: "SBI_Statement_Apr_2024.csv", date: "24 May 2024, 09:12 AM", status: "Processed" },
  ];

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
<<<<<<< HEAD
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Upload</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          Drop bank statements (CSV) and marketplace settlement reports here.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Step 1 */}
          <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-slate-100 dark:border-zinc-800 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">1</div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Choose file type</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select the type of statement you want to upload</p>
              </div>
            </div>
            <UploadTypeSelector value={type} onChange={setType} disabled={upload.isPending} />
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-slate-100 dark:border-zinc-800 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">2</div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Upload your file</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Drag and drop your CSV here or browse</p>
              </div>
            </div>
            
            <FileDropzone onFile={handleFile} disabled={upload.isPending} />

            {file && state && (
              <div className="mt-8">
                <UploadProgress filename={file.name} state={state} progress={progress} message={message} />
              </div>
            )}

            <div className="mt-8 p-4 rounded-2xl bg-indigo-50/50 flex items-center gap-3 text-[11px] font-bold text-slate-600">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Your data is secure and encrypted. We never share your information.
            </div>
          </div>
        </div>

        {/* Sidebar - Right Side */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Recent Uploads */}
          <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-slate-100 dark:border-zinc-800 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-900 dark:text-white">Recent uploads</h3>
              <button className="h-8 px-4 rounded-lg bg-slate-50 dark:bg-zinc-900 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-colors">View all</button>
            </div>
            <div className="space-y-6">
              {recentUploads.map((u, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[150px]">{u.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Uploaded on {u.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tighter">Processed</span>
                    <button className="text-slate-300 hover:text-slate-500"><MoreVertical className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Formats */}
          <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-slate-100 dark:border-zinc-800 p-8 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" /> Supported formats
            </h3>
            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed">We currently support the following formats</p>
            <div className="flex flex-wrap gap-2">
              {["CSV", "V2 Flat File", "XLSX"].map(f => (
                <span key={f} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">{f}</span>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-slate-100 dark:border-zinc-800 p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag className="h-4 w-4 text-indigo-600" />
              <h3 className="font-black text-slate-900 dark:text-white">Tips</h3>
            </div>
            <div className="space-y-4 mb-8">
              {[
                "Ensure your CSV file is exported in UTF-8 format.",
                "Maximum file size allowed is 10 MB.",
                "Make sure all dates are in DD/MM/YYYY format."
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <span className="text-xs font-bold text-slate-500 leading-relaxed">{t}</span>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-slate-50 dark:border-zinc-900 flex items-center justify-between">
               <span className="text-xs font-bold text-slate-400">Need help? <Link href="#" className="text-indigo-600 hover:underline inline-flex items-center gap-1">View guide <ExternalLink className="h-3 w-3" /></Link></span>
            </div>
          </div>
        </div>
=======
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
>>>>>>> 7e2b628697f97fdcdbbc80ff59dd9a8d8e6c31d9
      </div>
    </div>
  );
}
