/**
 * @file route.ts — POST /api/reconcile — trigger reconciliation for a settlement.
 * @module app/api/reconcile
 *
 * Fire-and-forget: starts reconciliation and responds immediately.
 * Called automatically after settlement upload and available for manual re-runs.
 *
 * @dependencies @/lib/auth, @/lib/reconciliation
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentBusiness } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { reconcile } from "@/lib/reconciliation";

const log = createLogger("API");

const bodySchema = z.object({
  settlement_id: z.string().uuid(),
});

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  const result = await getCurrentBusiness();
  if (!result) return errorResponse(401, "unauthorized", "Authentication required");
  if (!result.business) return errorResponse(403, "no_business", "Complete onboarding first");

  let body: unknown;
  try { body = await request.json(); } catch {
    return errorResponse(400, "invalid_json", "Request body must be JSON");
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "validation_error", issues: parsed.error.issues } }, { status: 400 });
  }

  const businessId = result.business.id;
  const { settlement_id } = parsed.data;

  reconcile(businessId, settlement_id).catch((err) => {
    log.error("Background reconciliation failed", {
      business: businessId.slice(0, 8),
      settlement: settlement_id.slice(0, 8),
      err: String(err),
    });
  });

  return NextResponse.json({ queued: true, settlement_id });
}
