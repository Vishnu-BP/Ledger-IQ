"use client";

/**
 * @file useStatementStatus.ts — TanStack Query polling hook for a statement.
 * @module lib/hooks
 *
 * Polls GET /api/statements/:id every 2s while status is one of the in-flight
 * values (`uploaded`, `parsing`, `categorizing`). Stops polling once the
 * server reports a terminal state (`complete`, `error`, `parsed`).
 *
 * Pass `undefined` to disable the query (e.g. before an upload exists).
 *
 * @dependencies @tanstack/react-query
 * @related app/api/statements/[id]/route.ts, app/(app)/upload/page.tsx
 */

import { useQuery } from "@tanstack/react-query";

export interface StatementStatusPayload {
  id: string;
  filename: string;
  status:
    | "uploaded"
    | "parsing"
    | "parsed"
    | "categorizing"
    | "complete"
    | "error";
  total_transactions: number | null;
  categorized_count: number;
  parse_error: string | null;
  completed_at: string | null;
}

const IN_FLIGHT = new Set<StatementStatusPayload["status"]>([
  "uploaded",
  "parsing",
  "categorizing",
]);

const POLL_INTERVAL_MS = 5000;

async function fetchStatus(id: string): Promise<StatementStatusPayload> {
  const res = await fetch(`/api/statements/${id}`);
  if (!res.ok) {
    let message = `Status check failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      /* non-JSON body */
    }
    throw new Error(message);
  }
  return (await res.json()) as StatementStatusPayload;
}

export function useStatementStatus(id: string | undefined) {
  return useQuery({
    queryKey: ["statement", id],
    queryFn: () => fetchStatus(id as string),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return POLL_INTERVAL_MS;
      return IN_FLIGHT.has(status) ? POLL_INTERVAL_MS : false;
    },
    refetchOnWindowFocus: false,
  });
}
