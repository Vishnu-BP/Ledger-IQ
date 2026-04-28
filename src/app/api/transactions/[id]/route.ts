/**
 * @file route.ts — PATCH and DELETE for /api/transactions/:id.
 * @module app/api/transactions/[id]
 *
 * PATCH allows the user to override category/channel/gst_head on a single
 * row (manual edit; AI re-categorisation is Layer 3). DELETE removes a row.
 * Both ownership-scoped via business_id in the service layer.
 *
 * Stage 3.5 will extend PATCH with `apply_to_similar` to bulk-update via
 * `category_overrides`. For 2.4 the body is just the field deltas.
 *
 * @dependencies next/server, zod, @/lib/auth, @/lib/transactions
 * @related lib/hooks/useUpdateTransaction.ts, lib/hooks/useDeleteTransaction.ts
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentBusiness } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import {
  TransactionNotFoundError,
  applyOverrideToSimilar,
  deleteTransaction,
  updateTransaction,
} from "@/lib/transactions";

const log = createLogger("API");

const patchSchema = z.object({
  category: z.string().max(120).nullable().optional(),
  channel: z.string().max(40).nullable().optional(),
  gst_head: z.string().max(120).nullable().optional(),
  apply_to_similar: z.boolean().optional().default(false),
});

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function authorizeAndGetBusiness() {
  const result = await getCurrentBusiness();
  if (!result) return { error: errorResponse(401, "unauthorized", "Authentication required") };
  if (!result.business)
    return { error: errorResponse(403, "no_business", "Complete onboarding first") };
  return { business: result.business };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authorizeAndGetBusiness();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "invalid_json", "Request body must be JSON");
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Invalid update payload",
          issues: parsed.error.issues,
        },
      },
      { status: 400 },
    );
  }

  try {
    const { apply_to_similar, ...patch } = parsed.data;

    if (apply_to_similar) {
      // Cascading override needs both category and a non-empty channel: an
      // override row in `category_overrides` requires both fields and the
      // sibling UPDATE blanks any prior values otherwise.
      if (!patch.category) {
        return errorResponse(
          400,
          "validation_error",
          "category is required when apply_to_similar=true",
        );
      }
      const result = await applyOverrideToSimilar({
        id: params.id,
        businessId: auth.business.id,
        category: patch.category,
        channel: patch.channel ?? null,
        gst_head: patch.gst_head ?? null,
      });
      return NextResponse.json({
        transaction: result.source,
        similar_count: result.similar_count,
        override_id: result.override_id,
      });
    }

    const updated = await updateTransaction({
      id: params.id,
      businessId: auth.business.id,
      ...patch,
    });
    return NextResponse.json({ transaction: updated });
  } catch (err) {
    if (err instanceof TransactionNotFoundError) {
      return errorResponse(404, "not_found", err.message);
    }
    log.error("updateTransaction failed", {
      id: params.id,
      error: String(err),
    });
    return errorResponse(500, "server_error", "Could not update transaction");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authorizeAndGetBusiness();
  if (auth.error) return auth.error;

  try {
    await deleteTransaction({
      id: params.id,
      businessId: auth.business.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TransactionNotFoundError) {
      return errorResponse(404, "not_found", err.message);
    }
    log.error("deleteTransaction failed", {
      id: params.id,
      error: String(err),
    });
    return errorResponse(500, "server_error", "Could not delete transaction");
  }
}
