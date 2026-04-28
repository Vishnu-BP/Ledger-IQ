/**
 * @file prePass.ts — Chain user-overrides then deterministic rules.
 * @module lib/categorization
 *
 * Returns matched results + the residual rows the LLM bulk pass needs to
 * handle. Order matters: overrides first so user intent always wins over a
 * default rule. Anything still unmatched goes to Llama in Stage 3.3.
 *
 * @related overrideReplay.ts, ruleBased.ts, types.ts
 */

import { createLogger } from "@/lib/logger";
import type { Transaction } from "@/types/transaction";

import { applyOverridesToBatch } from "./overrideReplay";
import { applyRulesToBatch } from "./ruleBased";
import type { CategorizationResult, PrePassResult } from "./types";

const log = createLogger("CATEGORIZE");

export async function runPrePass(
  businessId: string,
  txns: Transaction[],
): Promise<PrePassResult<Transaction>> {
  if (txns.length === 0) return { matched: [], unmatched: [] };

  const overridePass = await applyOverridesToBatch(businessId, txns);
  const rulesPass = applyRulesToBatch(overridePass.unmatched);

  const matched: CategorizationResult[] = [
    ...overridePass.matched,
    ...rulesPass.matched,
  ];

  log.info("Pre-pass complete", {
    business: businessId.slice(0, 8),
    total: txns.length,
    overrides: overridePass.matched.length,
    rules: rulesPass.matched.length,
    remaining: rulesPass.unmatched.length,
  });

  return { matched, unmatched: rulesPass.unmatched };
}
