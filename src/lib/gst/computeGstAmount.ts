/**
 * @file computeGstAmount.ts — Inclusive-of-tax GST extraction.
 * @module lib/gst
 *
 * Per PRD §F11, the bank-statement amount already contains GST embedded
 * (Indian SMBs receive gross totals, not net+tax). The reverse-charge
 * formula extracts the tax component:
 *
 *     gst_amount = amount × rate / (100 + rate)
 *
 * Returns a `numeric(14,2)`-compatible string. Returns "0.00" for any
 * rate ≤ 0 (exempt categories) or amount ≤ 0 (no row should pass these,
 * but we never want NaN reaching the DB).
 *
 * @related db/schema.ts (transactions.gst_amount column), seed.ts
 */

export function computeGstAmount(
  amount: string | number | null | undefined,
  gstRate: string | number | null | undefined,
): string {
  const a = typeof amount === "number" ? amount : Number(amount ?? 0);
  const r = typeof gstRate === "number" ? gstRate : Number(gstRate ?? 0);
  if (!Number.isFinite(a) || !Number.isFinite(r)) return "0.00";
  if (a <= 0 || r <= 0) return "0.00";
  const gst = (a * r) / (100 + r);
  return (Math.round(gst * 100) / 100).toFixed(2);
}
