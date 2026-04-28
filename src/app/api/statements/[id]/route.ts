/**
 * @file route.ts — GET /api/statements/:id — read a statement's status + progress.
 * @module app/api/statements/[id]
 *
 * Drives the polling UX while AI categorization runs in the background.
 * Returns parse + categorization state plus a categorized_count so the UI
 * can show "47 of 120 categorized" without re-querying the transactions
 * table itself.
 *
 * @dependencies @/lib/auth, @/lib/statements
 * @related lib/hooks/useStatementStatus.ts, app/(app)/upload/page.tsx
 */

import { NextResponse, type NextRequest } from "next/server";

import { getCurrentBusiness } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getStatement } from "@/lib/statements";

const log = createLogger("API");

function errorResponse(
  status: number,
  code: string,
  message: string,
): NextResponse {
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

  const statement = await getStatement(result.business.id, params.id);
  if (!statement) {
    return errorResponse(404, "not_found", "Statement not found");
  }

  log.info("Statement status fetched", {
    id: params.id.slice(0, 8),
    status: statement.status,
    progress: `${statement.categorized_count}/${statement.total_transactions ?? "?"}`,
  });

  return NextResponse.json(statement);
}
