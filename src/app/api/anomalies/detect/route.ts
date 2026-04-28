/**
 * @file route.ts — POST /api/anomalies/detect — trigger anomaly detection.
 * @module app/api/anomalies/detect
 *
 * Fire-and-forget: queues detection and responds immediately. Useful for
 * manual re-runs from the dashboard (e.g. after uploading more statements).
 *
 * @dependencies @/lib/auth, @/lib/anomalies
 */

import { NextResponse } from "next/server";

import { getCurrentBusiness } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { runAllDetectors } from "@/lib/anomalies";

const log = createLogger("API");

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST() {
  const result = await getCurrentBusiness();
  if (!result) return errorResponse(401, "unauthorized", "Authentication required");
  if (!result.business) return errorResponse(403, "no_business", "Complete onboarding first");

  const businessId = result.business.id;

  runAllDetectors(businessId).catch((err) => {
    log.error("Background anomaly detection failed", {
      business: businessId.slice(0, 8),
      err: String(err),
    });
  });

  return NextResponse.json({ queued: true });
}
