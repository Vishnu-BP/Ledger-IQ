/**
 * @file route.ts — PATCH /api/reconciliation/:id — update reconciliation status.
 * @module app/api/reconciliation/[id]
 *
 * Allows the UI to mark a reconciliation as disputed or resolved.
 *
 * @dependencies @/lib/auth, @/db/client, @/db/schema
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { getCurrentBusiness } from "@/lib/auth";
import { db } from "@/db/client";
import { reconciliations } from "@/db/schema";

const patchSchema = z.object({
  status: z.enum(["pending", "disputed", "resolved"]),
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
    return NextResponse.json({ error: { code: "validation_error" } }, { status: 400 });
  }

  const [updated] = await db
    .update(reconciliations)
    .set({ status: parsed.data.status })
    .where(
      and(
        eq(reconciliations.id, params.id),
        eq(reconciliations.business_id, result.business.id),
      ),
    )
    .returning();

  if (!updated) return errorResponse(404, "not_found", "Reconciliation not found");

  return NextResponse.json({ reconciliation: updated });
}
