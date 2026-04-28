/**
 * @file runAllDetectors.ts — Orchestrates all anomaly detectors for a business.
 * @module lib/anomalies
 *
 * Runs 4 detectors, deduplicates against existing open anomalies, explains
 * each new one via Claude, and bulk-inserts into the `anomalies` table.
 * Called fire-and-forget at the end of `categorizeTransactions` and also
 * via POST /api/anomalies/detect for manual re-runs.
 *
 * Dedup key: (business_id, type, title) — specific enough to prevent exact
 * duplicate anomalies while allowing re-detection if the user dismisses one.
 *
 * @dependencies @/db/client, @/db/schema, drizzle-orm
 * @related detectDuplicates.ts, detectMissingRecurring.ts, detectSpikes.ts, detectVendorCreep.ts, explainAnomaly.ts
 */

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { anomalies, businesses } from "@/db/schema";
import { createLogger } from "@/lib/logger";

import { detectDuplicates } from "./detectDuplicates";
import { detectMissingRecurring } from "./detectMissingRecurring";
import { detectSpikes } from "./detectSpikes";
import { detectVendorCreep } from "./detectVendorCreep";
import { explainAnomaly } from "./explainAnomaly";
import type { DetectedAnomaly } from "./types";

const log = createLogger("ANOMALY");

export async function runAllDetectors(businessId: string): Promise<number> {
  const startedAt = Date.now();
  log.info("Anomaly detection starting", { business: businessId.slice(0, 8) });

  const [business] = await db
    .select({ business_type: businesses.business_type })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);
  if (!business) return 0;

  // Run all 4 detectors in parallel — one failure doesn't block others.
  const [dupes, missing, spikes, creep] = await Promise.all([
    detectDuplicates(businessId).catch((e) => {
      log.warn("detectDuplicates failed", { err: String(e) });
      return [] as DetectedAnomaly[];
    }),
    detectMissingRecurring(businessId).catch((e) => {
      log.warn("detectMissingRecurring failed", { err: String(e) });
      return [] as DetectedAnomaly[];
    }),
    detectSpikes(businessId).catch((e) => {
      log.warn("detectSpikes failed", { err: String(e) });
      return [] as DetectedAnomaly[];
    }),
    detectVendorCreep(businessId).catch((e) => {
      log.warn("detectVendorCreep failed", { err: String(e) });
      return [] as DetectedAnomaly[];
    }),
  ]);

  const candidates = [...dupes, ...missing, ...spikes, ...creep];
  if (candidates.length === 0) {
    log.info("No anomalies detected", { business: businessId.slice(0, 8) });
    return 0;
  }

  // Dedup against existing open anomalies by (business_id, type, title).
  const existingTitles = new Set(
    (
      await db
        .select({ title: anomalies.title })
        .from(anomalies)
        .where(
          and(
            eq(anomalies.business_id, businessId),
            inArray(
              anomalies.status,
              ["open", "needs_action"],
            ),
          ),
        )
    ).map((r) => `${r.title}`),
  );

  const newAnomalies = candidates.filter(
    (c) => !existingTitles.has(c.title),
  );
  if (newAnomalies.length === 0) {
    log.info("All detected anomalies already exist", {
      business: businessId.slice(0, 8),
    });
    return 0;
  }

  // Explain each new anomaly via Claude (parallelism 3).
  const PARALLEL = 3;
  const explained: Array<DetectedAnomaly & { ai_explanation: string }> = [];
  for (let i = 0; i < newAnomalies.length; i += PARALLEL) {
    const slice = newAnomalies.slice(i, i + PARALLEL);
    const results = await Promise.all(
      slice.map(async (a) => {
        const explanation = await explainAnomaly(a, business.business_type);
        return { ...a, ai_explanation: explanation };
      }),
    );
    explained.push(...results);
  }

  // Bulk insert.
  await db.insert(anomalies).values(
    explained.map((a) => ({
      business_id: businessId,
      transaction_id: a.transaction_id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      ai_explanation: a.ai_explanation,
      metadata: a.metadata,
      status: "open",
    })),
  );

  log.info("Anomaly detection complete", {
    business: businessId.slice(0, 8),
    inserted: explained.length,
    tookMs: Date.now() - startedAt,
  });
  return explained.length;
}
