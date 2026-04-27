/**
 * @file amounts.ts — Numeric helpers shared by bank-format parsers.
 * @module lib/parsers
 *
 * Indian bank CSVs use comma-grouped numbers ("1,23,456.78"), sometimes with
 * trailing `DR`/`CR` markers, sometimes blank cells, sometimes a `-`. These
 * helpers normalise to a fixed-2-decimal string suitable for postgres numeric
 * columns, or null if the cell is empty/zero/non-numeric.
 *
 * @related formats/hdfc.ts, formats/icici.ts
 */

/**
 * Parse an amount cell. Returns null if empty / zero / unparseable.
 * Use for debit/credit columns where 0 means "this side is inactive".
 */
export function parseAmount(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n === 0) return null;
  return n.toFixed(2);
}

/**
 * Parse a balance cell. Like parseAmount, but allows zero as a valid value
 * (a closing balance of 0.00 is meaningful).
 */
export function parseBalance(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}
