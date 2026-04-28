/**
 * @file confidenceThresholds.ts — Threshold constants for the categorization pipeline.
 * @module lib/categorization
 *
 * Pulled into its own file so that any code which needs to interpret a
 * confidence score (UI badges, "Needs review" filter, edge-case selection)
 * imports the same numeric value.
 *
 * @related categorize.ts, components/transactions/ConfidenceBadge.tsx
 */

/**
 * Bulk-pass results below this score are sent to the Claude edge-case pass
 * for re-classification. Also used by Stage 3.5's "Needs review" UI filter.
 */
export const EDGE_CASE_THRESHOLD = 0.85;
