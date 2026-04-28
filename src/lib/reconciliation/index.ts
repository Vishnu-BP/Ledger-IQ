/**
 * @file index.ts — Barrel for the reconciliation module.
 * @module lib/reconciliation
 */

export { reconcile } from "./reconcile";
export { matchSettlement, DISCREPANCY_THRESHOLD } from "./matchSettlements";
export { analyzeDiscrepancies } from "./analyzeDiscrepancies";
export { explainDiscrepancy } from "./discrepancyExplainer";
export type { MatchResult } from "./matchSettlements";
export type { DiscrepancyRecord, DiscrepancyType } from "./analyzeDiscrepancies";
