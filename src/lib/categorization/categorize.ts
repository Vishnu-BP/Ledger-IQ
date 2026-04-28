/**
 * @file categorize.ts — Orchestrator for the two-tier AI categorization pipeline.
 * @module lib/categorization
 *
 * Implements PRD §14.1 steps 1–3 end-to-end:
 *   1. State transition: parsed → categorizing
 *   2. Pre-pass — user overrides + deterministic regex rules (Stage 3.2)
 *   3. Bulk pass — Llama 3.3 70B on the residual, in batches of 20
 *   4. Edge-case pass — Claude Sonnet 4.6 on rows where confidence < 0.85
 *   5. (Stage 3.4) GST head + amount + TCS mapping
 *   6. Atomic bulk write
 *   7. State transition: categorizing → complete (or error)
 *
 * Called fire-and-forget from `uploadStatement.ts` so the upload route can
 * respond immediately. Any uncaught failure flips the statement to status=
 * 'error' with a human-readable parse_error so the UI surfaces it.
 *
 * @dependencies @/db/client, @/db/schema, @/lib/openrouter, @/lib/categorization/*
 * @related uploadStatement.ts, app/api/statements/[id]/route.ts
 */

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import {
  businesses,
  gst_categories,
  statements,
  transactions,
} from "@/db/schema";
import { runAllDetectors } from "@/lib/anomalies";
import { mapGstFields } from "@/lib/gst";
import { createLogger } from "@/lib/logger";
import {
  OpenRouterClient,
  type BusinessContext,
  type LLMClient,
} from "@/lib/openrouter";
import type { Transaction } from "@/types/transaction";

import { runBulkPass } from "./bulkLlama";
import { runEdgeCasePass } from "./edgeCaseClaude";
import { bulkUpdateCategorizations } from "./persist";
import { runPrePass } from "./prePass";
import type { CategorizationResult } from "./types";

const log = createLogger("CATEGORIZE");

interface CategorizeOptions {
  /** Overridable for tests; defaults to a fresh OpenRouterClient. */
  client?: LLMClient;
}

export async function categorizeTransactions(
  businessId: string,
  statementId: string,
  options: CategorizeOptions = {},
): Promise<void> {
  const startedAt = Date.now();
  log.info("Categorization starting", {
    business: businessId.slice(0, 8),
    statement: statementId.slice(0, 8),
  });

  // ─── State: → categorizing ─────────────────────────────
  await db
    .update(statements)
    .set({ status: "categorizing" })
    .where(
      and(
        eq(statements.id, statementId),
        eq(statements.business_id, businessId),
      ),
    );

  try {
    // ─── Load context (business + categories + uncategorized rows) ──
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);
    if (!business) throw new Error(`Business ${businessId} not found`);

    const categoryRows = await db.select().from(gst_categories);
    const validCategories = categoryRows.map((c) => c.category);

    const uncategorized = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.statement_id, statementId),
          eq(transactions.business_id, businessId),
          isNull(transactions.category),
        ),
      );

    if (uncategorized.length === 0) {
      log.info("No uncategorized transactions; marking complete", {
        statement: statementId.slice(0, 8),
      });
      await markComplete(statementId, businessId);
      return;
    }

    const businessContext: BusinessContext = {
      business_type: business.business_type,
      channels: business.sales_channels ?? [],
      state: business.state ?? "Unknown",
      has_gstin: Boolean(business.gstin),
    };

    // ─── Pre-pass: overrides + regex rules ─────────────────
    const prePass = await runPrePass(businessId, uncategorized);

    // ─── Bulk LLM pass on the residual ─────────────────────
    const client = options.client ?? new OpenRouterClient();
    const bulkResults = await runBulkPass({
      client,
      business: businessContext,
      txns: prePass.unmatched,
      validCategories,
    });

    // Combine: pre-pass + bulk results.
    let combined: CategorizationResult[] = [...prePass.matched, ...bulkResults];

    // ─── Edge-case Claude pass on low-confidence rows ──────
    const txnsById = new Map(uncategorized.map((t) => [t.id, t]));
    combined = await runEdgeCasePass({
      client,
      business: businessContext,
      txnsById,
      prior: combined,
      validCategories,
    });

    // ─── GST mapping: head + rate + inclusive-of-tax extraction + TCS ───
    combined = mapGstFields(combined, txnsById, categoryRows);

    // ─── Persist all results atomically ────────────────────
    await bulkUpdateCategorizations(combined);

    // ─── State: → complete ─────────────────────────────────
    await markComplete(statementId, businessId);

    // Fire-and-forget anomaly detection after categorization finishes.
    runAllDetectors(businessId).catch((err) => {
      log.warn("Background anomaly detection failed", { err: String(err) });
    });

    log.info("Categorization complete", {
      statement: statementId.slice(0, 8),
      total: uncategorized.length,
      preRules: prePass.matched.length,
      bulkLlama: bulkResults.length,
      tookMs: Date.now() - startedAt,
    });
  } catch (err) {
    const message = (err as Error)?.message ?? "Unknown categorization error";
    log.error("Categorization failed", {
      statement: statementId.slice(0, 8),
      err: message,
    });
    await db
      .update(statements)
      .set({
        status: "error",
        parse_error: `Categorization failed: ${message}`,
      })
      .where(
        and(
          eq(statements.id, statementId),
          eq(statements.business_id, businessId),
        ),
      );
    throw err;
  }
}

async function markComplete(statementId: string, businessId: string): Promise<void> {
  await db
    .update(statements)
    .set({ status: "complete", completed_at: new Date() })
    .where(
      and(
        eq(statements.id, statementId),
        eq(statements.business_id, businessId),
      ),
    );
}
