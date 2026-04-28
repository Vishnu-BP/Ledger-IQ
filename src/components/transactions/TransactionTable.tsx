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

import { ReceiptText, FileDown, Columns as ColumnsIcon, ChevronLeft, ChevronRight } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface TransactionTableProps {
  categories: CategoryOption[];
}

export function TransactionTable({ categories }: TransactionTableProps) {
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
        <div className="mx-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs font-bold text-destructive">
          Could not load transactions: {error?.message ?? "unknown error"}
        </div>
      )}

      <div className="px-2">
        <TableShell>
          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={9} className="py-8">
                  <div className="h-4 w-full animate-pulse rounded-full bg-slate-100 dark:bg-zinc-900" />
                </TableCell>
              </TableRow>
            ))
          ) : !data || data.transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-64">
                <EmptyState
                  icon={ReceiptText}
                  title="No transactions match these filters"
                  description="Adjust the filters above, or upload a bank statement to get started."
                />
              </TableCell>
            </TableRow>
          ) : (
            data.transactions.map((t) => (
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

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-[32px] border-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500">
              This action cannot be undone. This will permanently delete the transaction:
              <div className="mt-2 p-4 rounded-2xl bg-slate-50 font-bold text-slate-900 text-xs italic">
                {deleteTarget?.description}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-2xl border-slate-100 font-bold" disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
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

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="w-[140px] text-[10px] font-black uppercase tracking-widest text-slate-400 h-16 pl-6">Transaction Date</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-16">Description</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-16">Sales Channel</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-16">Categorization</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-16 text-right pr-8">Debit</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-16 text-right pr-8">Credit</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-16 text-right pr-8">Balance</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-16">AI Status</TableHead>
            <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest text-slate-400 h-16 text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="border-t border-slate-50 dark:border-zinc-900/50">{children}</TableBody>
      </Table>
    </div>
  );
}

