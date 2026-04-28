"use client";

/**
 * @file TransactionRow.tsx — Single row in the transactions table.
 * @module components/transactions
 *
 * Actions (edit, delete) are hidden by default and revealed on row hover via
 * Tailwind group/group-hover utilities — keeps the table clean when scanning.
 * Amounts are prefixed: −₹X for debits, +₹X for credits.
 *
 * @related TransactionTable.tsx, ConfidenceBadge.tsx, AiReasoningTooltip.tsx
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

// ─── Types ─────────────────────────────────────────────────

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}

// ─── Component ─────────────────────────────────────────────

export function TransactionRow({ transaction: t, onEdit, onDelete }: TransactionRowProps) {
  return (
    <TableRow className="group transition-colors hover:bg-muted/30">
      {/* Date */}
      <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(t.transaction_date)}
      </TableCell>

      {/* Description */}
      <TableCell className="max-w-[260px] truncate py-3 text-sm font-medium" title={t.description}>
        {t.description}
      </TableCell>

      {/* Channel */}
      <TableCell className="py-3">
        {t.channel ? (
          <Badge variant="secondary" className="rounded-full font-normal text-xs">
            {getChannelLabel(t.channel)}
          </div>
        ) : (
          <AwaitingAi />
        )}
      </TableCell>

      {/* Category + confidence + AI reasoning */}
      <TableCell className="py-3 text-sm">
        {t.category ? (
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            <span className="text-sm">{t.category}</span>
            <ConfidenceBadge score={t.confidence_score} modelUsed={t.model_used} />
            <AiReasoningTooltip reasoning={t.ai_reasoning} />
          </span>
        ) : (
          <AwaitingAi />
        )}
      </TableCell>

      {/* Debit */}
      <TableCell className={cn(
        "py-3 text-right text-sm font-medium tabular-nums whitespace-nowrap",
        t.debit_amount ? "text-destructive" : "text-muted-foreground/30",
      )}>
        {t.debit_amount ? `−${formatINR(t.debit_amount)}` : "—"}
      </TableCell>

      {/* Credit */}
      <TableCell className={cn(
        "py-3 text-right text-sm font-medium tabular-nums whitespace-nowrap",
        t.credit_amount ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/30",
      )}>
        {t.credit_amount ? `+${formatINR(t.credit_amount)}` : "—"}
      </TableCell>

      {/* Balance */}
      <TableCell className="py-3 text-right text-xs text-muted-foreground tabular-nums whitespace-nowrap">
        {formatINR(t.closing_balance)}
      </TableCell>

      {/* Actions — only visible on row hover */}
      <TableCell className="py-3 text-right">
        <div className="flex justify-end gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onEdit}
            aria-label="Edit category"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive/70 hover:text-destructive"
            onClick={onDelete}
            aria-label="Delete transaction"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Helpers ───────────────────────────────────────────────

function AwaitingAi() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
      <span className="h-1 w-1 animate-pulse rounded-full bg-muted-foreground/50" />
      Awaiting AI
    </span>
  );
}

