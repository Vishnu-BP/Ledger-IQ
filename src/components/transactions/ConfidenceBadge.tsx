"use client";

/**
 * @file ConfidenceBadge.tsx — Provenance + confidence indicator next to category.
 * @module components/transactions
 *
 * Reads `confidence_score` + `model_used` and surfaces one of three pill states:
 *
 *   - `Rule`     — green, neutral icon. Set by ruleBased / overrideReplay
 *                  (model_used='rule-based' | 'override'); confidence is
 *                  always 1.0 here, the score is hidden — provenance is
 *                  the more meaningful signal.
 *   - `<%>`      — green ≥0.85, amber 0.60–0.85, red <0.60. Used for LLM
 *                  results (Llama / Claude / fallback). Score shown so the
 *                  user can spot rows that need review.
 *
 * Stage 3.5's "Needs review" filter targets the amber + red bands.
 *
 * @related TransactionRow.tsx, lib/categorization/types.ts
 */

import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  score: string | number | null | undefined;
  modelUsed: string | null | undefined;
  className?: string;
}

const HIGH_THRESHOLD = 0.85;
const MED_THRESHOLD = 0.6;

export function ConfidenceBadge({
  score,
  modelUsed,
  className,
}: ConfidenceBadgeProps) {
  if (!modelUsed) return null;

  if (modelUsed === "rule-based" || modelUsed === "override") {
    const label = modelUsed === "override" ? "User" : "Rule";
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700",
          className,
        )}
        title={
          modelUsed === "override"
            ? "Categorized by your prior override"
            : "Matched a deterministic rule"
        }
      >
        {label}
      </span>
    );
  }

  if (modelUsed === "fallback-uncategorized") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive",
          className,
        )}
        title="LLM bulk pass failed; defaulted to Uncategorized — needs manual review"
      >
        Fallback
      </span>
    );
  }

  const n = Number(score ?? 0);
  if (!Number.isFinite(n) || n <= 0) return null;
  const pct = Math.round(n * 100);

  let color: string;
  if (n >= HIGH_THRESHOLD) {
    color = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (n >= MED_THRESHOLD) {
    color = "border-amber-200 bg-amber-50 text-amber-700";
  } else {
    color = "border-destructive/30 bg-destructive/10 text-destructive";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
        color,
        className,
      )}
      title={`AI confidence ${pct}% (model: ${modelUsed})`}
    >
      {pct}%
    </span>
  );
}
