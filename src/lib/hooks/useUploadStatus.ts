"use client";

/**
 * @file useUploadStatus.ts — Unified TanStack polling hook for any upload type.
 * @module lib/hooks
 *
 * Branches by upload type:
 *   - bank_statement       → polls GET /api/statements/:id
 *   - amazon_settlement /
 *     flipkart_settlement  → polls GET /api/settlements/:id
 *
 * Returns a normalised `UploadStatusPayload` so consumers don't need to
 * branch by type for status rendering. Polls every 2s while the underlying
 * status is in-flight; stops on terminal states (`complete`, `reconciled`,
 * `error`).
 *
 * @dependencies @tanstack/react-query
 * @related app/api/statements/[id]/route.ts, app/api/settlements/[id]/route.ts
 */

import { useQuery } from "@tanstack/react-query";

import type { UploadType } from "@/components/upload";

export type UploadStatusValue =
  | "uploaded"
  | "parsing"
  | "parsed"
  | "categorizing"
  | "complete"
  | "reconciled"
  | "error";

export interface UploadStatusPayload {
  id: string;
  type: UploadType;
  filename: string;
  status: UploadStatusValue;
  parse_error: string | null;
  // Bank-only:
  total_transactions?: number | null;
  categorized_count?: number;
  // Settlement-only:
  marketplace?: string;
  total_amount?: string | null;
  lines_count?: number;
  reconciliation_count?: number;
  total_discrepancy?: string;
  deposit_date?: string | null;
}

const TERMINAL = new Set<UploadStatusValue>(["complete", "reconciled", "error"]);
const POLL_INTERVAL_MS = 2000;

async function fetchStatus(
  type: UploadType,
  id: string,
): Promise<UploadStatusPayload> {
  const path =
    type === "bank_statement"
      ? `/api/statements/${id}`
      : `/api/settlements/${id}`;

  const res = await fetch(path);
  if (!res.ok) {
    let message = `Status check failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      /* non-JSON */
    }
    throw new Error(message);
  }

  const data = (await res.json()) as Record<string, unknown>;

  // Normalise response into UploadStatusPayload shape.
  if (type === "bank_statement") {
    return {
      id: data.id as string,
      type,
      filename: data.filename as string,
      status: data.status as UploadStatusValue,
      total_transactions: data.total_transactions as number | null,
      categorized_count: (data.categorized_count as number) ?? 0,
      parse_error: (data.parse_error as string | null) ?? null,
    };
  }

  return {
    id: data.id as string,
    type,
    filename: data.filename as string,
    status: data.status as UploadStatusValue,
    marketplace: data.marketplace as string,
    total_amount: data.total_amount as string | null,
    lines_count: (data.lines_count as number) ?? 0,
    reconciliation_count: (data.reconciliation_count as number) ?? 0,
    total_discrepancy: (data.total_discrepancy as string) ?? "0",
    deposit_date: data.deposit_date as string | null,
    parse_error: (data.error as string | null) ?? null,
  };
}

export function useUploadStatus(
  type: UploadType | undefined,
  id: string | undefined,
) {
  return useQuery({
    queryKey: ["upload-status", type, id],
    queryFn: () => fetchStatus(type as UploadType, id as string),
    enabled: !!type && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return POLL_INTERVAL_MS;
      return TERMINAL.has(status) ? false : POLL_INTERVAL_MS;
    },
    refetchOnWindowFocus: false,
  });
}
