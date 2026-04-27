"use client";

/**
 * @file page.tsx — Upload screen: type selector + dropzone + progress.
 * @module app/(app)/upload
 *
 * Composes the three upload components and the useUpload mutation. Owns the
 * fake-animated progress bar (fetch doesn't expose upload progress); the bar
 * climbs to 90% during isPending and snaps to 100 on settle. Toasts final
 * state via sonner.
 *
 * After a successful upload, stage 2.2 will return the new statement id and
 * we'll route to /transactions to view parsed rows. For 2.1 we just show
 * the success state so the round-trip is visible.
 *
 * @dependencies @tanstack/react-query (via useUpload), sonner
 * @related components/upload/*, lib/hooks/useUpload.ts
 */

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
import { useUpload } from "@/lib/hooks";

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

  // Surface terminal state via toast once.
  useEffect(() => {
    if (upload.isSuccess && upload.data) {
      toast.success("Upload received", {
        description: `${upload.data.filename} is parsing.`,
      });
    }
    if (upload.isError && upload.error) {
      toast.error("Upload failed", {
        description: upload.error.message,
      });
    }
  }, [upload.isSuccess, upload.isError, upload.data, upload.error]);

  function handleFile(f: File) {
    setFile(f);
    upload.reset();
    upload.mutate({ file: f, type });
  }

  function reset() {
    setFile(null);
    setProgress(0);
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
      ? "Parsing on the server. Categorisation runs in Layer 3."
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
            and (after Layer 3) categorise it automatically.
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
