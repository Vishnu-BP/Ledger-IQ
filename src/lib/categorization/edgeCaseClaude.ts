/**
 * @file edgeCaseClaude.ts — Claude pass on low-confidence rows.
 * @module lib/categorization
 *
 * For each result with confidence < EDGE_CASE_THRESHOLD, ask Claude Sonnet
 * 4.6 to re-classify with extended context (business profile + (eventually)
 * similar past transactions). Runs in chunks of 5 via Promise.allSettled so
 * we parallelize without flooding Claude's per-account rate window.
 *
 * On per-row failure: keep the original (low-confidence) result. We don't
 * downgrade to fallback — a low-confidence Llama result is still better
 * than nothing.
 *
 * @dependencies zod, @/lib/openrouter
 * @related types.ts, confidenceThresholds.ts, categorize.ts
 */

import { z } from "zod";

import { createLogger } from "@/lib/logger";
import {
  buildEdgeCasePrompt,
  EDGE_CASE_MODEL,
  parseJsonResponse,
  withRetry,
  type BusinessContext,
  type LLMClient,
  type SimilarPastTransaction,
} from "@/lib/openrouter";
import { CHANNELS, type Channel } from "@/lib/transactions/channels";
import type { Transaction } from "@/types/transaction";

import { EDGE_CASE_THRESHOLD } from "./confidenceThresholds";
import type { CategorizationResult } from "./types";

const log = createLogger("CATEGORIZE");

const PARALLELISM = 5;
const VALID_CHANNELS = new Set<string>(CHANNELS.map((c) => c.value));

const EdgeResponseSchema = z.object({
  category: z.string().min(1),
  channel: z.string().min(1),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1),
});

interface RunEdgeCasePassInput {
  client: LLMClient;
  business: BusinessContext;
  txnsById: Map<string, Transaction>;
  prior: CategorizationResult[];
  validCategories: string[];
  /** Optional past-transaction lookup. For Stage 3.3 we always pass [], */
  /** Layer 4 may add a real similar-history fetch. */
  similarPast?: (txn: Transaction) => Promise<SimilarPastTransaction[]>;
}

export async function runEdgeCasePass(
  input: RunEdgeCasePassInput,
): Promise<CategorizationResult[]> {
  // Edge-case the LLM-produced low-confidence rows. Skip rule-based / override
  // (already 1.0) and skip fallback (LLM is failing — Claude likely will too).
  const candidates = input.prior.filter(
    (r) =>
      r.confidence < EDGE_CASE_THRESHOLD &&
      r.modelUsed !== "rule-based" &&
      r.modelUsed !== "override" &&
      r.modelUsed !== "fallback-uncategorized",
  );

  if (candidates.length === 0) return input.prior;

  log.info("Edge-case pass starting", {
    candidates: candidates.length,
    threshold: EDGE_CASE_THRESHOLD,
  });

  const results = new Map(input.prior.map((r) => [r.txnId, r]));

  for (let i = 0; i < candidates.length; i += PARALLELISM) {
    const slice = candidates.slice(i, i + PARALLELISM);
    const settled = await Promise.allSettled(
      slice.map((c) => reclassifyOne(input, c)),
    );
    for (let j = 0; j < settled.length; j++) {
      const r = settled[j];
      if (r.status === "fulfilled" && r.value) {
        results.set(r.value.txnId, r.value);
      } else if (r.status === "rejected") {
        log.warn("Edge-case classification failed; keeping prior result", {
          txn: slice[j].txnId.slice(0, 8),
          err: String((r.reason as Error)?.message ?? r.reason),
        });
      }
    }
  }

  return Array.from(results.values());
}

async function reclassifyOne(
  input: RunEdgeCasePassInput,
  prior: CategorizationResult,
): Promise<CategorizationResult | null> {
  const txn = input.txnsById.get(prior.txnId);
  if (!txn) return null;

  const similar = input.similarPast ? await input.similarPast(txn) : [];

  const messages = buildEdgeCasePrompt(
    input.business,
    {
      index: 0,
      date: txn.transaction_date,
      description: txn.description,
      amount:
        txn.debit_amount && Number(txn.debit_amount) > 0
          ? txn.debit_amount
          : (txn.credit_amount ?? "0"),
      direction:
        txn.debit_amount && Number(txn.debit_amount) > 0 ? "debit" : "credit",
      reference: txn.reference_number,
    },
    similar,
    input.validCategories,
    CHANNELS.map((c) => c.value),
  );

  const resp = await withRetry(
    () =>
      input.client.chat({
        model: EDGE_CASE_MODEL,
        messages,
        jsonMode: true,
        maxTokens: 600,
      }),
    { attempts: 3 },
  );

  const parsed = parseJsonResponse(resp.content, EdgeResponseSchema);

  const channel = VALID_CHANNELS.has(parsed.channel)
    ? (parsed.channel as Channel)
    : null;
  const categoryOk = input.validCategories.includes(parsed.category);
  if (!channel || !categoryOk) {
    log.warn("Edge-case result rejected (off-list); keeping prior", {
      txn: prior.txnId.slice(0, 8),
      category: parsed.category,
      channel: parsed.channel,
    });
    return null;
  }

  return {
    txnId: prior.txnId,
    category: parsed.category,
    channel,
    confidence: parsed.confidence,
    reasoning: parsed.reasoning,
    modelUsed: "anthropic/claude-sonnet-4.6",
  };
}
