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

import { Pencil, Trash2 } from "lucide-react";

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
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {formatDate(t.transaction_date)}
      </TableCell>
      <TableCell className="max-w-[280px] truncate text-sm" title={t.description}>
        {t.description}
      </TableCell>
      <TableCell>
        {t.channel ? (
          <Badge variant="secondary" className="font-normal">
            {getChannelLabel(t.channel)}
          </Badge>
        ) : (
          <AwaitingAi />
        )}
      </TableCell>
      <TableCell className="text-sm">
        {t.category ? (
          <span className="inline-flex items-center gap-1.5">
            <span>{t.category}</span>
            <ConfidenceBadge
              score={t.confidence_score}
              modelUsed={t.model_used}
            />
            <AiReasoningTooltip reasoning={t.ai_reasoning} />
          </span>
        ) : (
          <AwaitingAi />
        )}
      </TableCell>
      <TableCell
        className={cn(
          "whitespace-nowrap text-right text-sm font-medium",
          t.debit_amount && "text-destructive",
        )}
      >
        {t.debit_amount ? formatINR(t.debit_amount) : ""}
      </TableCell>
      <TableCell
        className={cn(
          "whitespace-nowrap text-right text-sm font-medium",
          t.credit_amount && "text-emerald-600",
        )}
      >
        {t.credit_amount ? formatINR(t.credit_amount) : ""}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right text-sm text-muted-foreground">
        {formatINR(t.closing_balance)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function AwaitingAi() {
  return (
    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      Awaiting AI
    </span>
  );
}
