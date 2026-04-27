"use client";

/**
 * @file UploadProgress.tsx — Filename + progress bar + status indicator.
 * @module components/upload
 *
 * Shown while an upload is in flight or after it settles. Three discrete
 * states drive the icon + status text; the numeric progress is fake-animated
 * by the parent (fetch doesn't expose upload progress events). For sub-second
 * uploads this reads as "indicator of life", which is what users want.
 *
 * @dependencies lucide-react, @/components/ui/progress
 * @related components/upload/index.ts, lib/hooks/useUpload.ts
 */

import { CheckCircle2, FileSpreadsheet, XCircle } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type UploadState = "uploading" | "success" | "error";

interface UploadProgressProps {
  filename: string;
  state: UploadState;
  progress: number; // 0..100
  message?: string;
}

export function UploadProgress({
  filename,
  state,
  progress,
  message,
}: UploadProgressProps) {
  return (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1 truncate text-sm font-medium">{filename}</div>
        {state === "success" && (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        )}
        {state === "error" && (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
      </div>
      <Progress
        value={progress}
        className={cn(state === "error" && "[&>div]:bg-destructive")}
      />
      {message && (
        <p
          className={cn(
            "text-xs",
            state === "error" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
