/**
 * @file route.ts — GET /api/settlements/:id — read settlement + reconciliation progress.
 * @module app/api/settlements/[id]
 *
 * Mirrors GET /api/statements/:id — drives the upload-page polling UX while
 * reconciliation runs in the background. The response shape includes the
 * marketplace, line count, reconciliation count, and total discrepancy so
 * the UI can show a meaningful step indicator.
 *
 * @dependencies @/lib/auth, @/lib/settlements
 * @related lib/hooks/useUploadStatus.ts
 */

import { NextResponse, type NextRequest } from "next/server";

import { getCurrentBusiness } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getSettlement } from "@/lib/settlements";

const log = createLogger("API");

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const result = await getCurrentBusiness();
  if (!result) return errorResponse(401, "unauthorized", "Authentication required");
  if (!result.business)
    return errorResponse(403, "no_business", "Complete onboarding first");

  const settlement = await getSettlement(result.business.id, params.id);
  if (!settlement) return errorResponse(404, "not_found", "Settlement not found");

  log.info("Settlement status fetched", {
    id: params.id.slice(0, 8),
    status: settlement.status,
    lines: settlement.lines_count,
    recons: settlement.reconciliation_count,
  });

  return NextResponse.json(settlement);
}
