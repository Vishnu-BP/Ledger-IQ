"use client";

/**
 * @file page.tsx — Upload screen: type selector + dropzone + progress + AI status.
 * @module app/(app)/upload
 *
 * Composes the three upload components, the useUpload mutation, and the
 * useStatementStatus polling hook. Three layers of feedback:
 *
 *   1. Upload progress (fake-animated bar during isPending; instant on settle).
 *   2. Parse-success toast — fires once when the route returns 200.
 *   3. Categorization status toasts — driven by polling
 *      `/api/statements/:id` every 2s while the statement is in flight.
 *      Fires once per terminal transition: complete → success toast (with
 *      "View transactions" action), error → error toast.
 *
 * @dependencies @tanstack/react-query (via useUpload + useStatementStatus), sonner
 * @related components/upload/*, lib/hooks/{useUpload,useStatementStatus}.ts
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  FileDropzone,
  UploadProgress,
  UploadTypeSelector,
  type UploadState,
  type UploadType,
} from "@/components/upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload</h1>
        <p className="text-sm text-muted-foreground">
          Drop bank statements (CSV) and marketplace settlement reports here.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>New upload</CardTitle>
          <CardDescription>
            Pick a file type, then drop or browse a CSV. We&apos;ll parse, store,
            and AI-categorise it automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <UploadTypeSelector
            value={type}
            onChange={setType}
            disabled={upload.isPending}
          />

          <FileDropzone onFile={handleFile} disabled={upload.isPending} />

          {file && state && (
            <UploadProgress
              filename={file.name}
              state={state}
              progress={progress}
              message={message}
            />
          )}

          {upload.isSuccess && status.data?.status === "complete" && (
            <Link
              href="/transactions"
              className="block text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              View categorised transactions →
            </Link>
          )}

          {(upload.isSuccess || upload.isError) && (
            <button
              type="button"
              onClick={reset}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              Upload another file
            </button>
          )}
        </CardContent>
      </Card>
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
