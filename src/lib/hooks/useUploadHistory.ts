"use client";

/**
 * @file useUploadHistory.ts — Recent uploads list (statements + settlements).
 * @module lib/hooks
 *
 * Hits GET /api/uploads/recent. Returns a unified list sorted by upload
 * recency. Used by the "Recent uploads" section on the upload page so the
 * user always has visibility of past work.
 *
 * @dependencies @tanstack/react-query
 * @related app/api/uploads/recent/route.ts
 */

import { useQuery } from "@tanstack/react-query";

import type { UploadType } from "@/components/upload";

export interface UploadHistoryItem {
  id: string;
  type: UploadType;
  filename: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
  count: number;
  uploaded_at: string;
  marketplace?: string;
  total_amount?: string | null;
  total_discrepancy?: string;
}

interface HistoryResponse {
  items: UploadHistoryItem[];
}

async function fetchHistory(): Promise<HistoryResponse> {
  const res = await fetch("/api/uploads/recent");
  if (!res.ok) throw new Error(`History fetch failed (${res.status})`);
  return (await res.json()) as HistoryResponse;
}

export function useUploadHistory() {
  return useQuery({
    queryKey: ["upload-history"],
    queryFn: fetchHistory,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}
