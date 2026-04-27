"use client";

/**
 * @file useUpdateTransaction.ts — Optimistic mutation for category/channel/GST overrides.
 * @module lib/hooks
 *
 * The ONLY allowed optimistic update in the app per CLAUDE.md "Optimistic
 * Updates — ONLY for: User category overrides". Snapshot every cached
 * transactions list before the mutation, patch the row in place, on error
 * roll back to the snapshots, on settle invalidate so server state wins.
 *
 * @dependencies @tanstack/react-query
 * @related app/api/transactions/[id]/route.ts, components/transactions/EditCategoryModal.tsx
 */

import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";

import {
  transactionKeys,
  type TransactionsResponse,
} from "@/lib/hooks/useTransactions";
import type { Transaction } from "@/types/transaction";

export interface UpdateTransactionInput {
  id: string;
  category?: string | null;
  channel?: string | null;
  gst_head?: string | null;
}

interface UpdateTransactionResponse {
  transaction: Transaction;
}

async function patchTransaction(
  input: UpdateTransactionInput,
): Promise<UpdateTransactionResponse> {
  const { id, ...patch } = input;
  const res = await fetch(`/api/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(body.error?.message ?? `Failed (${res.status})`);
  }
  return (await res.json()) as UpdateTransactionResponse;
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateTransactionResponse,
    Error,
    UpdateTransactionInput,
    { snapshots: Array<[QueryKey, TransactionsResponse | undefined]> }
  >({
    mutationFn: patchTransaction,
    onMutate: async (input) => {
      // Cancel any in-flight transactions queries so they don't overwrite the
      // optimistic patch.
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });

      // Snapshot every cached list query so we can roll back on error.
      const snapshots = queryClient.getQueriesData<TransactionsResponse>({
        queryKey: transactionKeys.all,
      });

      // Patch each list in place.
      for (const [key, data] of snapshots) {
        if (!data) continue;
        queryClient.setQueryData<TransactionsResponse>(key, {
          ...data,
          transactions: data.transactions.map((t) =>
            t.id === input.id
              ? {
                  ...t,
                  category: input.category ?? t.category,
                  channel: input.channel ?? t.channel,
                  gst_head: input.gst_head ?? t.gst_head,
                  user_overridden: true,
                }
              : t,
          ),
        });
      }

      return { snapshots };
    },
    onError: (_err, _input, context) => {
      if (!context) return;
      for (const [key, data] of context.snapshots) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
