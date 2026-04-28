/**
 * @file bulkLlama.ts — Llama 3.3 batched categorization pass.
 * @module lib/categorization
 *
 * Splits the unmatched residual into batches of 20 and asks Llama to return
 * a JSON array of categorizations. Each batch is wrapped in withRetry +
 * try/catch so one batch failure never blocks others — failed-batch rows
 * fall back to "Uncategorized" with a low confidence so the edge-case pass
 * can pick them up if Claude is healthy.
 *
 * @dependencies zod, @/lib/openrouter
 * @related types.ts, categorize.ts, prompts.ts (in lib/openrouter)
 */

import { z } from "zod";

import { createLogger } from "@/lib/logger";
import {
  BULK_MODEL,
  buildBulkCategorizationPrompt,
  FALLBACK_MODEL,
  type BusinessContext,
  type LLMClient,
  parseJsonResponse,
  withRetry,
} from "@/lib/openrouter";
import { CHANNELS, type Channel } from "@/lib/transactions/channels";
import type { Transaction } from "@/types/transaction";

import type { CategorizationResult, ModelUsed } from "./types";

const log = createLogger("CATEGORIZE");

const BATCH_SIZE = 20;
const VALID_CHANNELS = new Set<string>(CHANNELS.map((c) => c.value));

const BulkResponseSchema = z.object({
  results: z.array(
    z.object({
      index: z.number().int().min(0),
      category: z.string().min(1),
      channel: z.string().min(1),
      confidence: z.number().min(0).max(1),
      reasoning: z.string().min(1),
    }),
  ),
});

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function fallbackResult(txn: Transaction): CategorizationResult {
  return {
    txnId: txn.id,
    category: "Uncategorized",
    channel: "OPERATING_EXPENSE",
    confidence: 0.1,
    reasoning: "LLM bulk pass failed; defaulted to Uncategorized.",
    modelUsed: "fallback-uncategorized",
  };
}

interface RunBulkPassInput {
  client: LLMClient;
  business: BusinessContext;
  txns: Transaction[];
  validCategories: string[];
}

export async function runBulkPass(
  input: RunBulkPassInput,
): Promise<CategorizationResult[]> {
  if (input.txns.length === 0) return [];

  const batches = chunks(input.txns, BATCH_SIZE);
  const out: CategorizationResult[] = [];
  let model: typeof BULK_MODEL | typeof FALLBACK_MODEL = BULK_MODEL;

  log.info("Bulk pass starting", {
    txns: input.txns.length,
    batches: batches.length,
    initialModel: model,
  });

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const messages = buildBulkCategorizationPrompt(
      input.business,
      batch.map((t, i) => ({
        index: i,
        date: t.transaction_date,
        description: t.description,
        amount:
          t.debit_amount && Number(t.debit_amount) > 0
            ? t.debit_amount
            : (t.credit_amount ?? "0"),
        direction:
          t.debit_amount && Number(t.debit_amount) > 0 ? "debit" : "credit",
      })),
      input.validCategories,
      CHANNELS.map((c) => c.value),
    );

    try {
      const resp = await withRetry(
        () =>
          input.client.chat({
            model,
            messages,
            jsonMode: true,
            maxTokens: 2000,
          }),
        {
          attempts: 3,
          onRetry: (n, err) =>
            log.warn(`Bulk batch ${bi + 1} retry`, {
              attempt: n,
              err: String((err as Error)?.message ?? err),
            }),
        },
      );

      const parsed = parseJsonResponse(resp.content, BulkResponseSchema);

      // Map results back to source transaction by `index`.
      const seen = new Set<number>();
      for (const r of parsed.results) {
        if (r.index < 0 || r.index >= batch.length) continue;
        if (seen.has(r.index)) continue;
        seen.add(r.index);
        const txn = batch[r.index];

        // Validate category + channel against allowed lists. Anything off-list
        // becomes a fallback so downstream code never sees a hallucinated
        // category that breaks the GST mapping join.
        const channel = VALID_CHANNELS.has(r.channel)
          ? (r.channel as Channel)
          : null;
        const categoryOk = input.validCategories.includes(r.category);
        if (!channel || !categoryOk) {
          log.warn("Bulk result rejected (off-list)", {
            txn: txn.id.slice(0, 8),
            category: r.category,
            channel: r.channel,
          });
          out.push(fallbackResult(txn));
          continue;
        }

        out.push({
          txnId: txn.id,
          category: r.category,
          channel,
          confidence: r.confidence,
          reasoning: r.reasoning,
          modelUsed: model as ModelUsed,
        });
      }

      // Any txn the model skipped → fallback so the row isn't left null.
      for (let i = 0; i < batch.length; i++) {
        if (!seen.has(i)) {
          log.warn("Bulk model skipped txn", {
            txn: batch[i].id.slice(0, 8),
          });
          out.push(fallbackResult(batch[i]));
        }
      }
    } catch (err) {
      log.warn(`Bulk batch ${bi + 1} failed permanently`, {
        err: String((err as Error)?.message ?? err),
      });
      // Fallback this batch + degrade to Gemini Flash for remaining batches.
      for (const t of batch) out.push(fallbackResult(t));
      if (model === BULK_MODEL) {
        model = FALLBACK_MODEL;
        log.info("Switching bulk model to fallback for remaining batches", {
          model,
        });
      }
    }
  }

  return out;
}
