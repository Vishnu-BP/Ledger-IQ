/**
 * @file mapGstFields.ts — Populate gst_head / gst_rate / gst_amount / tcs_amount.
 * @module lib/gst
 *
 * Final pass of `categorizeTransactions`. Joins each `CategorizationResult`
 * to its seeded `gst_categories` row by `category` and returns an enriched
 * copy ready for persistence. Pure function — no DB or network I/O.
 *
 * Categories the LLM somehow returned that aren't in the seeded list are
 * left without GST fields and a warning is logged; this should not happen
 * because bulkLlama validates against `validCategories` before producing a
 * result, but defensive nulls beat NaN in the DB.
 *
 * @dependencies @/lib/logger, @/types/transaction
 * @related categorize.ts, computeGstAmount.ts, computeTcsAmount.ts
 */

import { createLogger } from "@/lib/logger";
import type { CategorizationResult } from "@/lib/categorization/types";
import type { Transaction } from "@/types/transaction";

import { buildCategoryIndex, type GstCategoryRow } from "./categoryMapping";
import { computeGstAmount } from "./computeGstAmount";
import { computeTcsAmount } from "./computeTcsAmount";

const log = createLogger("GST");

export function mapGstFields(
  results: CategorizationResult[],
  txnsById: Map<string, Transaction>,
  gstCategories: GstCategoryRow[],
): CategorizationResult[] {
  const index = buildCategoryIndex(gstCategories);
  let mapped = 0;
  let missing = 0;

  const enriched = results.map((r) => {
    const gst = index.get(r.category);
    if (!gst) {
      missing += 1;
      log.warn("GST category not in seeded table", { category: r.category });
      return r;
    }

    const txn = txnsById.get(r.txnId);
    if (!txn) return r;

    // Use whichever side of the row has value. For a debit row, GST embedded
    // in the outflow; for a credit row, GST embedded in the inflow. The
    // formula is the same.
    const amount =
      txn.debit_amount && Number(txn.debit_amount) > 0
        ? txn.debit_amount
        : txn.credit_amount && Number(txn.credit_amount) > 0
          ? txn.credit_amount
          : null;

    const gst_amount = amount ? computeGstAmount(amount, gst.gst_rate) : null;
    const tcs_amount = computeTcsAmount(gst, txn.credit_amount);

    mapped += 1;
    return {
      ...r,
      gst_head: gst.gst_section,
      gst_rate: gst.gst_rate,
      gst_amount,
      tcs_amount,
    };
  });

  log.info("GST mapping complete", { mapped, missing });
  return enriched;
}
