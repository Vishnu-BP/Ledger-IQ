/**
 * @file route.ts — PATCH /api/anomalies/:id — update anomaly status.
 * @module app/api/anomalies/[id]
 *
 * Allows the UI to mark anomalies as reviewed_ok, needs_action, or dismissed.
 * Business-scoped via the WHERE clause.
 *
 * @dependencies @/lib/auth, @/db/client, @/db/schema
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentBusiness } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { db } from "@/db/client";
import { anomalies } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const log = createLogger("API");

const patchSchema = z.object({
  status: z.enum(["open", "reviewed_ok", "needs_action", "dismissed"]),
  resolution_note: z.string().max(500).optional(),
});

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const result = await getCurrentBusiness();
  if (!result) return errorResponse(401, "unauthorized", "Authentication required");
  if (!result.business) return errorResponse(403, "no_business", "Complete onboarding first");

  let body: unknown;
  try { body = await request.json(); } catch {
    return errorResponse(400, "invalid_json", "Request body must be JSON");
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "validation_error", issues: parsed.error.issues } }, { status: 400 });
  }

  const [updated] = await db
    .update(anomalies)
    .set({
      status: parsed.data.status,
      resolution_note: parsed.data.resolution_note ?? null,
      resolved_at: ["reviewed_ok", "dismissed"].includes(parsed.data.status)
        ? new Date()
        : null,
    })
    .where(
      and(
        eq(anomalies.id, params.id),
        eq(anomalies.business_id, result.business.id),
      ),
    )
    .returning();

  if (!updated) return errorResponse(404, "not_found", "Anomaly not found");

  log.info("Anomaly status updated", {
    id: params.id.slice(0, 8),
    status: parsed.data.status,
  });

  return NextResponse.json({ anomaly: updated });
}
