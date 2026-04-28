/**
 * @file computeTcsAmount.ts — Marketplace TCS (1%) on settlement credits.
 * @module lib/gst
 *
 * Section 52 of the CGST Act requires 1% TCS on net taxable supplies routed
 * through e-commerce operators (Amazon, Flipkart, Meesho). The marketplace
 * deducts TCS from the seller's payout, so we surface the deducted amount on
 * the credit row to make GSTR-3B reconciliation trivial in Layer 5.
 *
 * The rate lives on the seeded `gst_categories.tcs_rate` row (1.00 for the
 * three Marketplace Settlement categories) — this helper treats TCS as a
 * category-driven property rather than channel-driven, so adding Meesho
 * later inherits the rate without code changes.
 *
 * Returns null when TCS doesn't apply (debits, non-marketplace categories,
 * or zero credit). The DB column is nullable.
 *
 * @related db/schema.ts (gst_categories.tcs_rate, transactions.tcs_amount), seed.ts
 */

export interface TcsInputCategory {
  tcs_applicable: boolean | null;
  tcs_rate: string | null;
}

export function computeTcsAmount(
  category: TcsInputCategory,
  creditAmount: string | number | null | undefined,
): string | null {
  if (!category.tcs_applicable || !category.tcs_rate) return null;
  const amt = typeof creditAmount === "number" ? creditAmount : Number(creditAmount ?? 0);
  const rate = Number(category.tcs_rate);
  if (!Number.isFinite(amt) || !Number.isFinite(rate)) return null;
  if (amt <= 0 || rate <= 0) return null;
  const tcs = amt * (rate / 100);
  return (Math.round(tcs * 100) / 100).toFixed(2);
}
