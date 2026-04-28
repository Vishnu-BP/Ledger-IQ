/**
 * @file index.ts — Barrel for the anomaly detection module.
 * @module lib/anomalies
 */

export { runAllDetectors } from "./runAllDetectors";
export { detectDuplicates } from "./detectDuplicates";
export { detectMissingRecurring } from "./detectMissingRecurring";
export { detectSpikes } from "./detectSpikes";
export { detectVendorCreep } from "./detectVendorCreep";
export { explainAnomaly } from "./explainAnomaly";
export type { DetectedAnomaly, AnomalyType, AnomalySeverity } from "./types";
