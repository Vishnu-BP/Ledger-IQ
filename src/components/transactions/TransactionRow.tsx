"use client";

/**
 * @file TransactionRow.tsx — Single row in the transactions table.
 * @module components/transactions
 *
 * Renders the row alongside its provenance pill (ConfidenceBadge — green
 * Rule/User, percent for LLM rows, red for fallback) and a hover-only
 * AiReasoningTooltip that surfaces the LLM's one-line justification.
 *
 * @related components/transactions/TransactionTable.tsx, ConfidenceBadge.tsx, AiReasoningTooltip.tsx
 */

import { Pencil, Trash2, CheckCircle2, Star, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { getChannelLabel } from "@/lib/transactions/channels";
import { cn, formatDate, formatINR } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

import { AiReasoningTooltip } from "./AiReasoningTooltip";
import { ConfidenceBadge } from "./ConfidenceBadge";

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}

export function TransactionRow({
  transaction: t,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const needsReview = t.confidence_score !== null && t.confidence_score < 0.8;

  return (
    <TableRow className="group border-b border-slate-50 dark:border-zinc-900/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-all duration-200">
      <TableCell className="whitespace-nowrap text-[11px] font-black text-slate-400 tabular-nums uppercase tracking-tight pl-6">
        {formatDate(t.transaction_date)}
      </TableCell>
      <TableCell className="max-w-[400px] truncate text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight py-6" title={t.description}>
        {t.description}
      </TableCell>
      <TableCell>
        {t.channel ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-100/50">
            {getChannelLabel(t.channel)}
          </div>
        ) : (
          <AwaitingAi />
        )}
      </TableCell>
      <TableCell>
        {t.category ? (
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{t.category}</span>
            <ConfidenceBadge
              score={t.confidence_score}
              modelUsed={t.model_used}
            />
          </div>
        ) : (
          <AwaitingAi />
        )}
      </TableCell>
      <TableCell className="text-right text-sm font-black text-slate-900 dark:text-slate-400 tabular-nums pr-8">
        {t.debit_amount ? `₹${Number(t.debit_amount).toLocaleString()}` : "—"}
      </TableCell>
      <TableCell className="text-right text-sm font-black text-emerald-600 tabular-nums pr-8">
        {t.credit_amount ? `₹${Number(t.credit_amount).toLocaleString()}` : "—"}
      </TableCell>
      <TableCell className="text-right text-[11px] font-black text-slate-400 tabular-nums uppercase tracking-widest pr-8">
        ₹{Number(t.closing_balance).toLocaleString()}
      </TableCell>
      <TableCell>
        {needsReview ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/50">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-widest">Needs review</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50">
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">Categorised</span>
          </div>
        )}
      </TableCell>
      <TableCell className="text-right pr-6">
        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={onEdit}
            className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-600/10 transition-all"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:shadow-lg hover:shadow-rose-600/10 transition-all"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function AwaitingAi() {
  return (
    <span className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
      Awaiting AI
    </span>
  );
}

