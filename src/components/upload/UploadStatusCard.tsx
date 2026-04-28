"use client";

/**
 * @file UploadStatusCard.tsx — Persistent status indicator for an in-flight upload.
 * @module components/upload
 *
 * Replaces the toast-only feedback with a visible card that shows:
 *   - Filename + size
 *   - Step pills (per upload type)
 *   - Progress fraction for bank statements ("47/120 categorised")
 *   - Discrepancy summary for settlements ("Amazon owes you ₹960")
 *   - Time estimate while in flight
 *   - Action button on completion (View transactions / View reconciliation)
 *
 * Driven by the `UploadStatusPayload` from `useUploadStatus`. Renders
 * nothing if no payload yet (the parent shows the dropzone instead).
 *
 * @related lib/hooks/useUploadStatus.ts, app/(app)/upload/page.tsx
 */

import { CheckCircle2, Loader2, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  UploadStatusPayload,
  UploadStatusValue,
} from "@/lib/hooks/useUploadStatus";
import { cn, formatINR } from "@/lib/utils";

import type { UploadType } from "./UploadTypeSelector";

interface UploadStatusCardProps {
  type: UploadType;
  filename: string;
  fileSize?: number;
  status?: UploadStatusValue;
  payload?: UploadStatusPayload;
  /** True while the initial POST /api/upload is still in flight. */
  uploading?: boolean;
  errorMessage?: string;
}

interface Step {
  key: string;
  label: string;
}

const BANK_STEPS: Step[] = [
  { key: "uploaded", label: "Uploaded" },
  { key: "parsing", label: "Parsing" },
  { key: "categorizing", label: "AI categorising" },
  { key: "complete", label: "Complete" },
];

const SETTLEMENT_STEPS: Step[] = [
  { key: "uploaded", label: "Uploaded" },
  { key: "reconciling", label: "Reconciling" },
  { key: "reconciled", label: "Complete" },
];

function activeIndex(steps: Step[], status: UploadStatusValue | undefined, uploading: boolean): number {
  if (uploading) return 0;
  if (!status) return 0;
  // For settlements, status='uploaded' means reconciliation hasn't run yet
  // OR has just finished. We show "Reconciling" while reconciliation_count=0
  // and status is uploaded.
  switch (status) {
    case "uploaded":
      return 0;
    case "parsing":
      return 1;
    case "parsed":
      return 1;
    case "categorizing":
      return 2;
    case "complete":
      return steps.length - 1;
    case "reconciled":
      return steps.length - 1;
    case "error":
      return -1;
    default:
      return 0;
  }
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function UploadStatusCard({
  type,
  filename,
  fileSize,
  status,
  payload,
  uploading = false,
  errorMessage,
}: UploadStatusCardProps) {
  const isSettlement = type !== "bank_statement";
  const steps = isSettlement ? SETTLEMENT_STEPS : BANK_STEPS;

  // Settlements: server starts at status='uploaded' and ends at 'reconciled'.
  // While reconciliation is running, show step 1 (Reconciling). We detect
  // "still working" by reconciliation_count > 0 OR uploaded with no reconciliations yet.
  let derivedStatus: UploadStatusValue | undefined = status;
  if (isSettlement && status === "uploaded") {
    // If we just got the upload back, treat as reconciling for ~UX
    derivedStatus = "uploaded";
  }

  const idx = activeIndex(steps, derivedStatus, uploading);
  const failed = derivedStatus === "error" || !!errorMessage;
  const isTerminal = derivedStatus === "complete" || derivedStatus === "reconciled";

  return (
    <Card className="border-2">
      <CardContent className="space-y-4 pt-5">
        {/* Filename + size */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" title={filename}>
              {filename}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(fileSize)}
              {fileSize ? " · " : ""}
              {typeLabel(type)}
            </p>
          </div>
          {failed ? (
            <XCircle className="h-5 w-5 shrink-0 text-destructive" />
          ) : isTerminal ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Step pills */}
        <ol className="flex items-center gap-1.5 overflow-x-auto">
          {steps.map((step, i) => {
            const done = !failed && i < idx;
            const active = !failed && i === idx;
            return (
              <li key={step.key} className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className={cn(
                    "inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors",
                    failed
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : done
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {done && <CheckCircle2 className="h-3 w-3" />}
                  {active && <Loader2 className="h-3 w-3 animate-spin" />}
                  {step.label}
                </span>
                {i < steps.length - 1 && <span className="text-muted-foreground/40">›</span>}
              </li>
            );
          })}
        </ol>

        {/* Progress / summary text */}
        <ProgressSummary
          type={type}
          status={derivedStatus}
          payload={payload}
          uploading={uploading}
          failed={failed}
          errorMessage={errorMessage}
        />

        {/* Action buttons on completion */}
        {isTerminal && (
          <div className="flex flex-wrap gap-2 pt-1">
            {type === "bank_statement" ? (
              <Button asChild size="sm">
                <Link href="/transactions">
                  View transactions <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/reconciliation">
                  View reconciliation <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressSummary({
  type,
  status,
  payload,
  uploading,
  failed,
  errorMessage,
}: {
  type: UploadType;
  status: UploadStatusValue | undefined;
  payload: UploadStatusPayload | undefined;
  uploading: boolean;
  failed: boolean;
  errorMessage: string | undefined;
}) {
  if (failed) {
    return (
      <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {errorMessage ?? payload?.parse_error ?? "Something went wrong. Try again."}
      </p>
    );
  }

  if (uploading) {
    return (
      <p className="text-sm text-muted-foreground">Uploading file to LedgerIQ…</p>
    );
  }

  if (type === "bank_statement") {
    if (status === "complete") {
      return (
        <p className="text-sm">
          <span className="font-semibold text-foreground">
            {payload?.categorized_count ?? 0}
          </span>
          <span className="text-muted-foreground"> of </span>
          <span className="font-semibold text-foreground">
            {payload?.total_transactions ?? 0}
          </span>
          <span className="text-muted-foreground"> transactions categorised.</span>
        </p>
      );
    }
    if (status === "categorizing") {
      return (
        <p className="text-sm">
          AI is categorising{" "}
          <span className="font-semibold">
            {payload?.categorized_count ?? 0}
          </span>{" "}
          of{" "}
          <span className="font-semibold">
            {payload?.total_transactions ?? "?"}
          </span>{" "}
          transactions… <span className="text-muted-foreground">usually 30–60s</span>
        </p>
      );
    }
    return (
      <p className="text-sm text-muted-foreground">
        Parsing CSV. Detecting bank format… usually under 5s
      </p>
    );
  }

  // Settlement summary
  if (status === "reconciled" || status === "complete") {
    const discrepancy = Number(payload?.total_discrepancy ?? 0);
    const recCount = payload?.reconciliation_count ?? 0;
    if (discrepancy > 10 && recCount > 0) {
      return (
        <p className="text-sm">
          <span className="font-semibold text-destructive">
            {payload?.marketplace === "flipkart" ? "Flipkart" : "Amazon"} owes you{" "}
            {formatINR(discrepancy.toFixed(2))}
          </span>{" "}
          <span className="text-muted-foreground">across {recCount} discrepancies.</span>
        </p>
      );
    }
    return (
      <p className="text-sm text-emerald-700">
        ✓ All settled — no discrepancies found across {payload?.lines_count ?? 0} line items.
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Reconciling {payload?.lines_count ?? "…"} settlement lines against your bank credits…
      <span className="ml-1">usually 10–20s</span>
    </p>
  );
}

function typeLabel(type: UploadType): string {
  switch (type) {
    case "bank_statement":
      return "Bank statement";
    case "amazon_settlement":
      return "Amazon settlement";
    case "flipkart_settlement":
      return "Flipkart settlement";
    default:
      return "Upload";
  }
}
