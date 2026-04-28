/**
 * @file overrideReplay.ts — Replay user category overrides on new transactions.
 * @module lib/categorization
 *
 * For every uncategorized row, look up an exact-description match (lowercased,
 * trimmed) in the business's `category_overrides` table. When a row hits, pin
 * confidence=1.0 and stamp `model_used='override'` so the UI surfaces the
 * provenance ("you set this rule").
 *
 * Key shape mirrors what Stage 3.5 inserts: `description_pattern` is stored
 * already-normalised, so the lookup map is just `lower(trim(...))` on both
 * sides.
 *
 * @dependencies @/db/client, @/db/schema, drizzle-orm
 * @related ruleBased.ts, lib/transactions/applyOverrideToSimilar.ts (Stage 3.5)
 */

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { category_overrides } from "@/db/schema";
import type { Channel } from "@/lib/transactions/channels";
import { CHANNELS } from "@/lib/transactions/channels";
import type { Transaction } from "@/types/transaction";

import type { CategorizationResult, PrePassResult } from "./types";

const VALID_CHANNELS = new Set<string>(CHANNELS.map((c) => c.value));

function normalise(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function isChannel(value: string | null | undefined): value is Channel {
  return typeof value === "string" && VALID_CHANNELS.has(value);
}

export async function applyOverridesToBatch(
  businessId: string,
  txns: Transaction[],
): Promise<PrePassResult<Transaction>> {
  if (txns.length === 0) return { matched: [], unmatched: [] };

  const overrides = await db
    .select()
    .from(category_overrides)
    .where(eq(category_overrides.business_id, businessId));

  if (overrides.length === 0) return { matched: [], unmatched: [...txns] };

  const byPattern = new Map<string, (typeof overrides)[number]>();
  for (const o of overrides) {
    byPattern.set(normalise(o.description_pattern), o);
  }

  const matched: CategorizationResult[] = [];
  const unmatched: Transaction[] = [];

  for (const txn of txns) {
    const key = normalise(txn.description);
    const hit = key && byPattern.get(key);
    // The override row's category is required; channel is optional in DB
    // but we only call it a match when both are present + the channel is
    // a known slug. Otherwise fall through to the LLM.
    if (hit && hit.override_category && isChannel(hit.override_channel)) {
      matched.push({
        txnId: txn.id,
        category: hit.override_category,
        channel: hit.override_channel,
        confidence: 1.0,
        reasoning: `User override (${hit.id.slice(0, 8)})`,
        modelUsed: "override",
      });
    } else {
      unmatched.push(txn);
    }
  }

  return { matched, unmatched };
}
