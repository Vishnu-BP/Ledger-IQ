/**
 * @file types.ts — Shared types for the anomaly detection pipeline.
 * @module lib/anomalies
 */

export type AnomalyType =
  | "duplicate"
  | "missing_recurring"
  | "spike"
  | "vendor_creep";

export type AnomalySeverity = "high" | "medium" | "low";

export interface DetectedAnomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  /** UUID of the primary suspicious transaction — null for pattern-based anomalies. */
  transaction_id: string | null;
  metadata: Record<string, unknown>;
}
