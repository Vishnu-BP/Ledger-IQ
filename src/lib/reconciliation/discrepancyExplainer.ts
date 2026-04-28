/**
 * @file discrepancyExplainer.ts — Claude explanation per reconciliation discrepancy.
 * @module lib/reconciliation
 *
 * Calls Claude Sonnet 4.6 with PRD §13.6 prompt template. Falls back to a
 * deterministic template on any LLM failure so the reconciliation page always
 * has something useful to show.
 *
 * @dependencies @/lib/openrouter
 */

import { z } from "zod";

import { createLogger } from "@/lib/logger";
import {
  buildReconciliationPrompt,
  EDGE_CASE_MODEL,
  OpenRouterClient,
  parseJsonResponse,
  withRetry,
} from "@/lib/openrouter";

import type { DiscrepancyRecord } from "./analyzeDiscrepancies";

const log = createLogger("RECONCILE");

const ExplanationSchema = z.object({ explanation: z.string().min(10) });

const FALLBACK: Record<string, string> = {
  missing_commission_reversal:
    "Amazon refunded the product amount for a return but did not reverse the original commission charged. This is a common discrepancy when returns are processed by a different settlement cycle. Raise a case in Amazon Seller Central under Payments > Manage Reimbursements.",
  fee_mismatch:
    "The fees deducted by Amazon in this settlement don't match what was expected based on your product listings. Check your FBA fee reports and commission schedule in Seller Central. If the rates differ from your signed agreement, file a dispute.",
  unprocessed_refund:
    "A customer refund appears in Amazon's system but hasn't been reflected in the settlement credit to your account. This typically clears in the next settlement cycle, but if it persists beyond 2 cycles, raise a reimbursement case.",
  payout_mismatch:
    "The amount Amazon disbursed to your bank account differs from the stated settlement total. This may be due to a held reserve, previous balance offset, or bank processing delay. Review your Payments Ledger in Seller Central for the exact breakdown.",
};

export async function explainDiscrepancy(
  record: DiscrepancyRecord,
  client?: OpenRouterClient,
): Promise<string> {
  try {
    const llm = client ?? new OpenRouterClient();
    const messages = buildReconciliationPrompt({
      expected_amount: record.expected_amount,
      actual_amount: record.actual_amount,
      discrepancy: record.discrepancy,
      discrepancy_type: record.discrepancy_type,
      affected_order_ids: record.affected_order_ids,
      settlement_details: record.settlement_details,
    });

    const resp = await withRetry(
      () =>
        llm.chat({
          model: EDGE_CASE_MODEL,
          messages,
          jsonMode: true,
          maxTokens: 400,
        }),
      { attempts: 2 },
    );

    const parsed = parseJsonResponse(resp.content, ExplanationSchema);
    return parsed.explanation;
  } catch (err) {
    log.warn("explainDiscrepancy LLM failed; using template", {
      type: record.discrepancy_type,
      err: String((err as Error)?.message ?? err),
    });
    return (
      FALLBACK[record.discrepancy_type] ??
      "A discrepancy was found between the Amazon settlement and your bank account. Review Seller Central Payments for details."
    );
  }
}
