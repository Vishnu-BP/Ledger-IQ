"use client";

/**
 * @file useUpload.ts — TanStack Query mutation for file uploads to /api/upload.
 * @module lib/hooks
 *
 * Wraps fetch + FormData in a typed mutation. The mutation throws on any
 * non-2xx response so TanStack Query routes the error path; the caller reads
 * `error.message` for the toast. Stable contract — used by the upload page in
 * stage 2.1 and (later) by the settlement upload flow in stage 4.3.
 *
 * Note: `fetch()` does not expose upload progress; the calling page animates
 * a fake progress bar during `isPending`. See PRD §F1 + plan stage 2.1.
 *
 * @dependencies @tanstack/react-query
 * @related components/upload/*, app/api/upload/route.ts (stage 2.2)
 */

import { useMutation } from "@tanstack/react-query";

import { createLogger } from "@/lib/logger";
import type { UploadType } from "@/components/upload";

const log = createLogger("UPLOAD");

export interface UploadInput {
  file: File;
  type: UploadType;
}

export interface UploadResult {
  id: string;
  type: UploadType;
  status: string;
  filename: string;
  estimated_completion_seconds?: number;
}

interface UploadErrorBody {
  error?: { code?: string; message?: string };
}

async function postUpload(input: UploadInput): Promise<UploadResult> {
  const body = new FormData();
  body.append("file", input.file);
  body.append("type", input.type);

  log.info("Uploading file", {
    name: input.file.name,
    bytes: input.file.size,
    type: input.type,
  });

  const res = await fetch("/api/upload", { method: "POST", body });

  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    try {
      const body = (await res.json()) as UploadErrorBody;
      if (body?.error?.message) message = body.error.message;
    } catch {
      // Non-JSON body (e.g. 404 HTML). Keep generic message.
    }
    log.warn("Upload rejected", { status: res.status, message });
    throw new Error(message);
  }

  return (await res.json()) as UploadResult;
}

export function useUpload() {
  return useMutation<UploadResult, Error, UploadInput>({
    mutationFn: postUpload,
  });
}
