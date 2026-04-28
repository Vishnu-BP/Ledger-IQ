/**
 * @file ruleBased.ts — Apply deterministic regex rules to a transaction batch.
 * @module lib/categorization
 *
 * Pure function. Walks `RULES` in order; first match wins. Returns matched
 * rows as `CategorizationResult[]` and untouched rows as `unmatched[]` for
 * the LLM bulk pass to handle.
 *
 * @related patterns.ts, types.ts
 */

import type { Transaction } from "@/types/transaction";
import { RULES, type Rule } from "./patterns";
import type { CategorizationResult, PrePassResult } from "./types";

function getDirection(txn: Transaction): "debit" | "credit" | "none" {
  if (txn.debit_amount && Number(txn.debit_amount) > 0) return "debit";
  if (txn.credit_amount && Number(txn.credit_amount) > 0) return "credit";
  return "none";
}

function findMatch(txn: Transaction): Rule | null {
  const desc = txn.description ?? "";
  if (!desc) return null;
  const direction = getDirection(txn);
  for (const rule of RULES) {
    if (rule.direction && rule.direction !== direction) continue;
    if (rule.regex.test(desc)) return rule;
  }
  return null;
}

export function applyRulesToBatch(
  txns: Transaction[],
): PrePassResult<Transaction> {
  const matched: CategorizationResult[] = [];
  const unmatched: Transaction[] = [];
  for (const txn of txns) {
    const rule = findMatch(txn);
    if (rule) {
      matched.push({
        txnId: txn.id,
        category: rule.category,
        channel: rule.channel,
        confidence: 1.0,
        reasoning: `Matched rule: ${rule.name}`,
        modelUsed: "rule-based",
      });
    } else {
      unmatched.push(txn);
    }
  }
  return { matched, unmatched };
}
