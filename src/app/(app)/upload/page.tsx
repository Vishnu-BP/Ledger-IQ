"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  UploadProgress,
  UploadTypeSelector,
  type UploadState,
  type UploadType,
} from "@/components/upload";
import { useStatementStatus, useUpload } from "@/lib/hooks";

const FAKE_PROGRESS_TARGET = 90;
const FAKE_PROGRESS_INTERVAL_MS = 100;

export default function UploadPage() {
  const upload = useUpload();
  const [type, setType] = useState<UploadType>("bank_statement");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drive the fake progress bar while the mutation is in flight.
  useEffect(() => {
    if (upload.isPending) {
      setProgress(0);
      intervalRef.current = setInterval(() => {
        setProgress((p) =>
          p < FAKE_PROGRESS_TARGET ? p + 6 : FAKE_PROGRESS_TARGET,
        );
      }, FAKE_PROGRESS_INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (upload.isSuccess || upload.isError) setProgress(100);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [upload.isPending, upload.isSuccess, upload.isError]);

  // Surface upload-mutation terminal state via toast once.
  useEffect(() => {
    if (upload.isSuccess && upload.data) {
      toast.success("Upload received", {
        description: `${upload.data.filename} parsed. AI categorising in background…`,
      });
    }
    if (upload.isError && upload.error) {
      toast.error("Upload failed", {
        description: upload.error.message,
      });
    }
  }, [upload.isSuccess, upload.isError, upload.data, upload.error]);

  // Poll the statement once we have an ID. Toasts fire on terminal transitions.
  const statementId = upload.data?.id;
  const status = useStatementStatus(statementId);
  const lastStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const data = status.data;
    if (!data) return;
    if (lastStatusRef.current === data.status) return;
    lastStatusRef.current = data.status;

    if (data.status === "complete") {
      toast.success("Categorisation complete", {
        description: `${data.categorized_count} of ${data.total_transactions ?? data.categorized_count} transactions categorised.`,
        action: {
          label: "View",
          onClick: () => {
            window.location.href = "/transactions";
          },
        },
        duration: 8000,
      });
    } else if (data.status === "error") {
      toast.error("Categorisation failed", {
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
    setProgress(0);
    lastStatusRef.current = null;
    upload.reset();
  }

  const state: UploadState | null = upload.isPending
    ? "uploading"
    : upload.isSuccess
      ? "success"
      : upload.isError
        ? "error"
        : null;

  const message = upload.isPending
    ? "Uploading…"
    : upload.isSuccess
      ? statusMessage(status.data?.status, status.data?.categorized_count, status.data?.total_transactions ?? upload.data?.total_transactions)
      : upload.isError
        ? upload.error?.message
        : undefined;

  return (
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
      </div>
    </div>
  );
}

function statusMessage(
  status: string | undefined,
  categorized: number | undefined,
  total: number | null | undefined,
): string {
  switch (status) {
    case "uploaded":
    case "parsing":
      return "Parsing on the server…";
    case "parsed":
      return "Parsed. Queued for AI categorisation…";
    case "categorizing":
      return `AI categorising ${categorized ?? 0}${total ? ` of ${total}` : ""}…`;
    case "complete":
      return `Categorised ${categorized ?? 0}${total ? ` of ${total}` : ""} transactions.`;
    case "error":
      return "Categorisation hit an error — see toast.";
    default:
      return "Parsing on the server…";
  }
}
