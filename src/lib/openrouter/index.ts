/**
 * @file index.ts — Barrel for the OpenRouter LLM gateway.
 * @module lib/openrouter
 */

export { OpenRouterClient } from "./client";
export type { OpenRouterClientOptions } from "./client";
export { BULK_MODEL, EDGE_CASE_MODEL, FALLBACK_MODEL } from "./models";
export {
  buildBulkCategorizationPrompt,
  buildEdgeCasePrompt,
  buildAnomalyExplanationPrompt,
  buildReconciliationPrompt,
  type BusinessContext,
  type BulkTransaction,
  type EdgeCaseTransaction,
  type SimilarPastTransaction,
  type AnomalyContext,
  type ReconciliationContext,
} from "./prompts";
export { parseJsonResponse } from "./parseResponse";
export { withRetry, type RetryOptions } from "./retry";
export {
  LLMError,
  LLMParseError,
  type LLMClient,
  type ChatMessage,
  type ChatRequest,
  type ChatResponse,
  type ChatRole,
  type ChatUsage,
} from "./types";
