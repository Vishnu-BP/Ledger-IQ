/**
 * @file index.ts — Barrel for the categorization pipeline.
 * @module lib/categorization
 */

export { categorizeTransactions } from "./categorize";
export { runPrePass } from "./prePass";
export { applyRulesToBatch } from "./ruleBased";
export { applyOverridesToBatch } from "./overrideReplay";
export { runBulkPass } from "./bulkLlama";
export { runEdgeCasePass } from "./edgeCaseClaude";
export { bulkUpdateCategorizations } from "./persist";
export { EDGE_CASE_THRESHOLD } from "./confidenceThresholds";
export { RULES, type Rule, type Direction } from "./patterns";
export type {
  CategorizationResult,
  ModelUsed,
  PrePassResult,
} from "./types";
