"use client";

/**
 * @file TransactionTable.tsx — Main transactions list view.
 * @module components/transactions
 *
 * Reads filters from URL searchParams, drives `useTransactions` for data,
 * orchestrates the EditCategoryModal + delete confirmation. Handles three
 * data states: loading (skeleton), empty (CTA), populated (table).
 *
 * @dependencies @/lib/hooks (useTransactions, useDeleteTransaction)
 * @related app/(app)/transactions/page.tsx
 */

import { ReceiptText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import {
  EditCategoryModal,
  type CategoryOption,
} from "@/components/transactions/EditCategoryModal";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteTransaction, useTransactions } from "@/lib/hooks";
import type { TransactionFilters as TFilters } from "@/lib/hooks";
import type { Transaction } from "@/types/transaction";

interface TransactionTableProps {
  categories: CategoryOption[];
}

export function TransactionTable({ categories }: TransactionTableProps) {
  const searchParams = useSearchParams();
  const filters: TFilters = {
    start_date: searchParams.get("start_date") ?? undefined,
    end_date: searchParams.get("end_date") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  };

  const { data, isLoading, isError, error } = useTransactions(filters);
  const deleteMutation = useDeleteTransaction();

  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        toast.success("Transaction deleted");
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  }

  return (
    <div className="space-y-4">
      <TransactionFilters />

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Could not load transactions: {error?.message ?? "unknown error"}
        </div>
      )}

      {isLoading ? (
        <TableShell>
          {[...Array(8)].map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={8}>
                <div className="h-5 w-full animate-pulse rounded bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        </TableShell>
      ) : !data || data.transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No transactions match these filters"
          description="Adjust the filters above, or upload a bank statement to get started."
        />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Showing {data.transactions.length} of {data.total_count}
          </p>
          <TableShell>
            {data.transactions.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                onEdit={() => setEditTarget(t)}
                onDelete={() => setDeleteTarget(t)}
              />
            ))}
          </TableShell>
        </>
      )}

      <EditCategoryModal
        transaction={editTarget}
        categories={categories}
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription className="line-clamp-2">
              {deleteTarget?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[110px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}
