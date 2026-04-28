/**
 * @file categoryMapping.ts — In-memory lookup against the seeded gst_categories.
 * @module lib/gst
 *
 * Categorization loads `gst_categories` once per pipeline invocation and
 * passes the row list through. This helper builds a fast Map keyed by
 * `category` + offers an O(1) lookup so the GST mapping pass doesn't loop
 * over the rows for every transaction.
 *
 * @related db/schema.ts (gst_categories), mapGstFields.ts, db/seed.ts
 */

export interface GstCategoryRow {
  category: string;
  gst_section: string;
  gst_rate: string;
  is_blocked_itc: boolean | null;
  tcs_applicable: boolean | null;
  tcs_rate: string | null;
}

export function buildCategoryIndex(
  rows: GstCategoryRow[],
): Map<string, GstCategoryRow> {
  return new Map(rows.map((r) => [r.category, r]));
}
