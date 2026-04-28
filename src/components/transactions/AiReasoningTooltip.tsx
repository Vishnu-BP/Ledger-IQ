"use client";

/**
 * @file AiReasoningTooltip.tsx — Hover-reveal of the LLM's one-line justification.
 * @module components/transactions
 *
 * The bulk + edge-case prompts ask the model for a short reasoning string
 * which is stored in `transactions.ai_reasoning`. Users review low-confidence
 * rows by hovering this icon to see *why* the AI picked the category before
 * deciding whether to override.
 *
 * Returns null when there's nothing to show (rule-based rows just have
 * "Matched rule: <name>" which is already self-evident from the Rule badge).
 *
 * @related TransactionRow.tsx, ConfidenceBadge.tsx
 */

import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AiReasoningTooltipProps {
  reasoning: string | null | undefined;
}

export function AiReasoningTooltip({ reasoning }: AiReasoningTooltipProps) {
  if (!reasoning || reasoning.startsWith("Matched rule:")) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="AI reasoning"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-xs leading-relaxed">{reasoning}</p>
      </TooltipContent>
    </Tooltip>
  );
}
