"use client";

/**
 * @file TransactionTable.tsx — Main transactions list view with filter bar + table.
 * @module components/transactions
 *
 * Reads filters from URL searchParams, drives useTransactions for data,
 * and orchestrates EditCategoryModal + delete confirmation. Three states:
 * loading (skeleton rows), empty (EmptyState), populated (table).
 *
 * @dependencies @/lib/hooks (useTransactions, useDeleteTransaction)
 * @related app/(app)/transactions/page.tsx
 */

import { ReceiptText, FileDown, Columns as ColumnsIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { EditCategoryModal, type CategoryOption } from "@/components/transactions/EditCategoryModal";
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

// ─── Skeleton ──────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          <TableCell><div className="h-3.5 w-16 rounded bg-muted" /></TableCell>
          <TableCell><div className="h-3.5 w-48 rounded bg-muted" /></TableCell>
          <TableCell><div className="h-5 w-14 rounded-full bg-muted" /></TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-28 rounded bg-muted" />
              <div className="h-5 w-8 rounded bg-muted" />
            </div>
          </TableCell>
          <TableCell><div className="ml-auto h-3.5 w-16 rounded bg-muted" /></TableCell>
          <TableCell><div className="ml-auto h-3.5 w-16 rounded bg-muted" /></TableCell>
          <TableCell><div className="ml-auto h-3.5 w-20 rounded bg-muted" /></TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

// ─── Table shell ───────────────────────────────────────────

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {["Date", "Description", "Channel", "Category"].map((h) => (
              <TableHead key={h} className="py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {h}
              </TableHead>
            ))}
            {["Debit", "Credit", "Balance"].map((h) => (
              <TableHead key={h} className="py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {h}
              </TableHead>
            ))}
            <TableHead className="w-[68px]" />
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────

export function TransactionTable({ categories }: { categories: CategoryOption[] }) {
  const searchParams = useSearchParams();
  const filters: TFilters = {
    start_date: searchParams.get("start_date") ?? undefined,
    end_date: searchParams.get("end_date") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    needs_review: searchParams.get("needs_review") === "1" ? "1" : undefined,
  };

  const { data, isLoading, isError, error } = useTransactions(filters);
  const deleteMutation = useDeleteTransaction();

  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteMutation.mutate(target.id, {
      onSuccess: () => { toast.success("Transaction deleted"); setDeleteTarget(null); },
      onError: (err) => { toast.error(err.message); },
    });
  }

  return (
    <div className="space-y-6">
      <TransactionFilters />

      <div className="flex items-center justify-between px-6 pt-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Showing <span className="text-slate-900 dark:text-white">1 to {data?.transactions.length || 0}</span> of <span className="text-slate-900 dark:text-white">{data?.total_count || 0}</span> transactions
        </p>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all">
            <FileDown className="h-3.5 w-3.5" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all">
            <ColumnsIcon className="h-3.5 w-3.5" />
            Columns
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load transactions: {error?.message ?? "unknown error"}
        </div>
      )}

      {isLoading ? (
        <TableShell><SkeletonRows /></TableShell>
      ) : !data || data.transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No transactions match these filters"
          description="Adjust the filters above, or upload a bank statement to get started."
        />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{data.transactions.length}</span>
            {" "}of{" "}
            <span className="font-medium text-foreground">{data.total_count}</span>
            {" "}transactions
          </p>
          <TableShell>
            {data.transactions.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                onEdit={() => setEditTarget(t)}
                onDelete={() => setDeleteTarget(t)}
              />
            ))
          )}
          </TableShell>
        </div>

      {/* Pagination Placeholder */}
      <div className="flex items-center justify-between px-6 pb-6">
        <div className="flex items-center gap-2">
          <select className="bg-transparent text-xs font-bold text-slate-500 outline-none cursor-pointer">
            <option>10 per page</option>
            <option>20 per page</option>
            <option>50 per page</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} className={cn("h-8 w-8 rounded-lg text-xs font-black transition-all", i === 1 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:bg-slate-50")}>{i}</button>
          ))}
          <span className="text-slate-300 mx-1">...</span>
          <button className="h-8 w-8 rounded-lg text-xs font-black text-slate-400 hover:bg-slate-50">9</button>
          <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <EditCategoryModal
        transaction={editTarget}
        categories={categories}
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500">
              This action cannot be undone. This will permanently delete the transaction:
              <div className="mt-2 p-4 rounded-2xl bg-slate-50 font-bold text-slate-900 text-xs italic">
                {deleteTarget?.description}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="rounded-2xl bg-rose-500 text-white font-black hover:bg-rose-600 shadow-lg shadow-rose-500/20"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
