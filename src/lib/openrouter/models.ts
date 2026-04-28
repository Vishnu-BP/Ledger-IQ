/**
 * @file models.ts — Pinned OpenRouter model slugs.
 * @module lib/openrouter
 *
 * Verified against https://openrouter.ai/api/v1/models on 2026-04-28 via
 * scripts/verify-models.ts. Re-run that script if categorization starts
 * failing with `model_not_found` (slug deprecated).
 *
 * @related scripts/verify-models.ts
 */

/** Bulk pass — Llama 3.3 70B Instruct. Cheap, fast, ~80% of rows land here. */
export const BULK_MODEL = "meta-llama/llama-3.3-70b-instruct" as const;

/**
 * Edge-case pass — Claude Sonnet 4.6.
 * Used when the bulk model returns confidence < EDGE_CASE_THRESHOLD.
 * Also drives anomaly explanations + reconciliation reasoning in Layer 4.
 */
export const EDGE_CASE_MODEL = "anthropic/claude-sonnet-4.6" as const;

/**
 * Fallback for the bulk pass when Llama is rate-limited or returning 5xx
 * after retry-with-backoff exhausts. Same JSON-output contract as Llama.
 */
export const FALLBACK_MODEL = "google/gemini-2.5-flash" as const;
