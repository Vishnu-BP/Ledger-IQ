"use client";

/**
 * @file useTransactions.ts — TanStack Query hook for the transactions table.
 * @module lib/hooks
 *
 * Single canonical query factory + hook used by the transactions page. Stale
 * time = 60 s per CLAUDE.md TanStack Query Conventions ("transactions =
 * medium").
 *
 * Filters are passed in as a plain object; they're serialised into the
 * fetch URL and into the query key so identical filter sets share cache.
 *
 * @dependencies @tanstack/react-query
 * @related app/api/transactions/route.ts, components/transactions/TransactionTable.tsx
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import type { Transaction } from "@/types/transaction";

export interface TransactionFilters {
  start_date?: string;
  end_date?: string;
  search?: string;
  category?: string;
  channel?: string;
  /** "1" enables the < 0.85 confidence filter. */
  needs_review?: "1";
  limit?: number;
  offset?: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total_count: number;
  filters_applied: TransactionFilters;
}

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.all, filters] as const,
  detail: (id: string) => ["transaction", id] as const,
};

async function fetchTransactions(
  filters: TransactionFilters,
): Promise<TransactionsResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const res = await fetch(`/api/transactions?${params.toString()}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(body.error?.message ?? `Failed (${res.status})`);
  }
  return (await res.json()) as TransactionsResponse;
}

export function useTransactions(
  filters: TransactionFilters = {},
  options?: Omit<
    UseQueryOptions<TransactionsResponse, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<TransactionsResponse, Error>({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions(filters),
    staleTime: 60_000,
    ...options,
  });
}
