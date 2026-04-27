"use client";

/**
 * @file useDeleteTransaction.ts — DELETE mutation for a single transaction.
 * @module lib/hooks
 *
 * No optimistic update here (per CLAUDE.md, optimistic is reserved for
 * category overrides). Standard loading state + invalidate on success.
 *
 * @dependencies @tanstack/react-query
 * @related app/api/transactions/[id]/route.ts, components/transactions/TransactionTable.tsx
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { transactionKeys } from "@/lib/hooks/useTransactions";

async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(body.error?.message ?? `Failed (${res.status})`);
  }
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
