/**
 * @file types.ts — Shared types for the categorization pipeline.
 * @module lib/categorization
 *
 * `CategorizationResult` is the universal output shape — produced by the
 * rule-based pre-pass, the override replay, the Llama bulk pass, and the
 * Claude edge-case pass. Stage 3.3's persist layer writes any of these
 * directly into the `transactions` table.
 *
 * @related lib/transactions/channels.ts, db/schema.ts
 */

import type { Channel } from "@/lib/transactions/channels";

/**
 * Provenance string written into `transactions.model_used`. Stage 3.5's
 * confidence badge relies on these literal values to decide which UI to show.
 */
export type ModelUsed =
  | "rule-based"
  | "override"
  | "llama-3.3-70b-instruct"
  | "anthropic/claude-sonnet-4.6"
  | "google/gemini-2.5-flash"
  | "fallback-uncategorized";

export interface CategorizationResult {
  txnId: string;
  category: string;
  channel: Channel;
  /** 0.0–1.0; rule-based + override are pinned at 1.0. */
  confidence: number;
  reasoning: string;
  modelUsed: ModelUsed;
  /** Stage 3.4 (mapGstFields) populates these. Empty string means "no GST head". */
  gst_head?: string | null;
  gst_rate?: string | null;
  gst_amount?: string | null;
  tcs_amount?: string | null;
}

export interface PrePassResult<T> {
  matched: CategorizationResult[];
  unmatched: T[];
}
