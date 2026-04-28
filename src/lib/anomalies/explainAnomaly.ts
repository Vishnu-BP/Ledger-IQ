/**
 * @file explainAnomaly.ts — Claude explanation for a detected anomaly.
 * @module lib/anomalies
 *
 * Calls Claude Sonnet 4.6 with the anomaly context and returns a plain-
 * English 2-3 sentence explanation. On any LLM failure (rate limit, parse
 * error, etc.) falls back to a deterministic template so the pipeline never
 * crashes because of an AI outage.
 *
 * @dependencies @/lib/openrouter
 * @related runAllDetectors.ts, lib/openrouter/prompts.ts
 */

import { z } from "zod";

import { createLogger } from "@/lib/logger";
import {
  buildAnomalyExplanationPrompt,
  EDGE_CASE_MODEL,
  OpenRouterClient,
  parseJsonResponse,
  withRetry,
} from "@/lib/openrouter";

import type { DetectedAnomaly } from "./types";

const log = createLogger("ANOMALY");

const ExplanationSchema = z.object({
  explanation: z.string().min(10),
});

const FALLBACK_TEMPLATES: Record<string, string> = {
  duplicate:
    "A transaction with the same amount and description appeared twice within a few days. This may be a duplicate charge or a bank processing error. Review both transactions and contact your bank if needed.",
  missing_recurring:
    "A payment that has occurred regularly in recent months did not appear this period. Verify whether the payment was delayed, cancelled, or processed under a different description.",
  spike:
    "An unusually large spend was detected in this category compared to recent history. Review the transaction to confirm it was authorised and expected.",
  vendor_creep:
    "This vendor's charges have increased by more than 15% compared to the previous period. Check your contract terms or recent invoices to verify the price change.",
};

export async function explainAnomaly(
  anomaly: DetectedAnomaly,
  businessType: string,
  client?: OpenRouterClient,
): Promise<string> {
  try {
    const llm = client ?? new OpenRouterClient();
    const messages = buildAnomalyExplanationPrompt({
      type: anomaly.type,
      metadata: anomaly.metadata,
      business_type: businessType,
    });

    const resp = await withRetry(
      () =>
        llm.chat({
          model: EDGE_CASE_MODEL,
          messages,
          jsonMode: true,
          maxTokens: 300,
        }),
      { attempts: 2 },
    );

    const parsed = parseJsonResponse(resp.content, ExplanationSchema);
    return parsed.explanation;
  } catch (err) {
    log.warn("explainAnomaly LLM failed; using template", {
      type: anomaly.type,
      err: String((err as Error)?.message ?? err),
    });
    return FALLBACK_TEMPLATES[anomaly.type] ?? "An anomaly was detected. Please review this transaction.";
  }
}
